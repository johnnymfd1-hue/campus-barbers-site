import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { 
  getRealIP, 
  getRequestMetadata, 
  isHoneypotTriggered, 
  createEvidenceRecord,
  normalizePhone,
  normalizeEmail,
  checkRateLimit,
  generateFingerprint
} from '@/lib/security'

interface BookingRequest {
  name: string
  phone: string
  email?: string
  service: string
  barber: string
  date: string
  time: string
  notes?: string
  fingerprint?: {
    screenResolution: string
    timezone: string
    language: string
    platform: string
    cookiesEnabled: boolean
    doNotTrack: string | null
  }
  timeOnPage: number
  _hp_website?: string
  _hp_company?: string
  _hp_fax?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json()
    const ip = getRealIP()
    const metadata = getRequestMetadata()

    // =======================
    // RATE LIMITING
    // =======================
    if (!checkRateLimit(ip, 5, 60000)) { // 5 requests per minute max
      // Log to evidence box
      await logEvidence({
        ...metadata,
        ip,
        type: 'rate_limit',
        data: body,
      })
      
      // Silent fail - don't reveal rate limiting
      return NextResponse.json({ success: true, bookingId: 'fake-' + Date.now() })
    }

    // =======================
    // HONEYPOT CHECK
    // =======================
    const honeypotData = {
      website: body._hp_website || '',
      company: body._hp_company || '',
      fax: body._hp_fax || '',
    }
    
    const honeypotResult = isHoneypotTriggered(honeypotData)
    
    if (honeypotResult.triggered) {
      // BOT DETECTED - Log to evidence box, return fake success
      await logEvidence({
        ...metadata,
        ip,
        type: 'honeypot',
        honeypotField: honeypotResult.value,
        data: body,
      })
      
      // Silent success - bot thinks it worked
      return NextResponse.json({ success: true, bookingId: 'fake-' + Date.now() })
    }

    // =======================
    // TIME ON PAGE CHECK
    // =======================
    // If form submitted in less than 3 seconds, likely a bot
    if (body.timeOnPage < 3000) {
      await logEvidence({
        ...metadata,
        ip,
        type: 'too_fast',
        timeOnPage: body.timeOnPage,
        data: body,
      })
      
      // Silent success
      return NextResponse.json({ success: true, bookingId: 'fake-' + Date.now() })
    }

    // =======================
    // DO NOT BOOK CHECK
    // =======================
    const normalizedPhone = normalizePhone(body.phone)
    const normalizedEmail = body.email ? normalizeEmail(body.email) : null

    // Check DNB list by phone
    const dnbByPhone = await adminDb
      .collection('doNotBook')
      .where('normalizedPhone', '==', normalizedPhone)
      .limit(1)
      .get()

    if (!dnbByPhone.empty) {
      // Client is blocked - log and return fake success
      await logEvidence({
        ...metadata,
        ip,
        type: 'dnb_blocked',
        reason: 'phone_match',
        dnbId: dnbByPhone.docs[0].id,
        data: { name: body.name, phone: body.phone },
      })
      
      return NextResponse.json({ success: true, bookingId: 'fake-' + Date.now() })
    }

    // Check DNB list by email if provided
    if (normalizedEmail) {
      const dnbByEmail = await adminDb
        .collection('doNotBook')
        .where('normalizedEmail', '==', normalizedEmail)
        .limit(1)
        .get()

      if (!dnbByEmail.empty) {
        await logEvidence({
          ...metadata,
          ip,
          type: 'dnb_blocked',
          reason: 'email_match',
          dnbId: dnbByEmail.docs[0].id,
          data: { name: body.name, email: body.email },
        })
        
        return NextResponse.json({ success: true, bookingId: 'fake-' + Date.now() })
      }
    }

    // =======================
    // FIND OR CREATE CLIENT
    // =======================
    let clientId: string
    let isNewClient = false

    // Try to find existing client by phone
    const existingClient = await adminDb
      .collection('clients')
      .where('normalizedPhone', '==', normalizedPhone)
      .limit(1)
      .get()

    if (!existingClient.empty) {
      clientId = existingClient.docs[0].id
      
      // Update client info if needed
      await adminDb.collection('clients').doc(clientId).update({
        lastVisit: new Date().toISOString(),
        name: body.name, // Update name in case it changed
        email: body.email || existingClient.docs[0].data().email,
      })
    } else {
      // Create new client
      isNewClient = true
      const clientRef = await adminDb.collection('clients').add({
        name: body.name,
        phone: body.phone,
        normalizedPhone,
        email: body.email || null,
        normalizedEmail,
        verified: false,
        bookings: 0,
        completed: 0,
        noShows: 0,
        cancellations: 0,
        createdAt: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        notes: '',
      })
      clientId = clientRef.id

      // Also create public-facing record (name only for staff)
      await adminDb.collection('clientsPublic').doc(clientId).set({
        name: body.name,
        lastVisit: new Date().toISOString(),
      })
    }

    // =======================
    // STORE FINGERPRINT
    // =======================
    if (body.fingerprint) {
      const fpHash = generateFingerprint({
        ip,
        userAgent: metadata.userAgent,
        acceptLanguage: body.fingerprint.language,
        screenResolution: body.fingerprint.screenResolution,
        timezone: body.fingerprint.timezone,
      })

      await adminDb.collection('fingerprints').doc(fpHash).set({
        clientId,
        ip,
        userAgent: metadata.userAgent,
        fingerprint: body.fingerprint,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }, { merge: true })
    }

    // =======================
    // CREATE APPOINTMENT
    // =======================
    const appointmentRef = await adminDb.collection('appointments').add({
      clientId,
      clientName: body.name,
      service: body.service,
      barberId: body.barber,
      date: body.date,
      time: body.time,
      notes: body.notes || '',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      createdVia: 'website',
      ip,
    })

    // Update client booking count
    await adminDb.collection('clients').doc(clientId).update({
      bookings: (existingClient.empty ? 0 : existingClient.docs[0].data().bookings || 0) + 1,
    })

    // Log successful booking (for analytics, not security)
    await adminDb.collection('bookingLogs').add({
      appointmentId: appointmentRef.id,
      clientId,
      isNewClient,
      ip,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ 
      success: true, 
      bookingId: appointmentRef.id,
    })

  } catch (error) {
    console.error('Booking error:', error)
    
    // Log error but don't expose details
    try {
      await logEvidence({
        type: 'server_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    } catch (e) {
      // Ignore logging errors
    }

    return NextResponse.json(
      { success: false, error: 'Booking failed' },
      { status: 500 }
    )
  }
}

// Helper function to log to evidence box
async function logEvidence(data: Record<string, unknown>) {
  try {
    await adminDb.collection('evidence').add({
      ...data,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Failed to log evidence:', e)
  }
}
