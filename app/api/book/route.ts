import { NextRequest, NextResponse } from 'next/server'
import {
  getRealIP,
  getRequestMetadata,
  isHoneypotTriggered,
  normalizePhone,
  normalizeEmail,
  checkRateLimit,
  generateFingerprint
} from '@/lib/security'

// Force dynamic — prevents build-time static rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy-load firebase-admin to prevent build worker crash
async function getDb() {
  const { getAdminDb } = await import('@/lib/firebase-admin')
  return getAdminDb()
}

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
    const ip = await getRealIP()
    const metadata = await getRequestMetadata()
    const db = await getDb()

    // =======================
    // RATE LIMITING
    // =======================
    if (!checkRateLimit(ip, 5, 60000)) {
      await logEvidence({
        ...metadata,
        ip,
        type: 'rate_limit',
        data: body,
      })
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
      await logEvidence({
        ...metadata,
        ip,
        type: 'honeypot',
        honeypotField: honeypotResult.value,
        data: body,
      })
      return NextResponse.json({ success: true, bookingId: 'fake-' + Date.now() })
    }

    // =======================
    // TIME ON PAGE CHECK
    // =======================
    if (body.timeOnPage < 3000) {
      await logEvidence({
        ...metadata,
        ip,
        type: 'too_fast',
        timeOnPage: body.timeOnPage,
        data: body,
      })
      return NextResponse.json({ success: true, bookingId: 'fake-' + Date.now() })
    }

    // =======================
    // DO NOT BOOK CHECK
    // =======================
    const normalizedPhone = normalizePhone(body.phone)
    const normalizedEmail = body.email ? normalizeEmail(body.email) : null

    const dnbByPhone = await db
      .collection('doNotBook')
      .where('normalizedPhone', '==', normalizedPhone)
      .limit(1)
      .get()

    if (!dnbByPhone.empty) {
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

    if (normalizedEmail) {
      const dnbByEmail = await db
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

    const existingClient = await db
      .collection('clients')
      .where('normalizedPhone', '==', normalizedPhone)
      .limit(1)
      .get()

    if (!existingClient.empty) {
      clientId = existingClient.docs[0].id

      await db.collection('clients').doc(clientId).update({
        lastVisit: new Date().toISOString(),
        name: body.name,
        email: body.email || existingClient.docs[0].data().email,
      })
    } else {
      isNewClient = true
      const clientRef = await db.collection('clients').add({
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

      await db.collection('clientsPublic').doc(clientId).set({
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

      await db.collection('fingerprints').doc(fpHash).set({
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
    const appointmentRef = await db.collection('appointments').add({
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

    await db.collection('clients').doc(clientId).update({
      bookings: (existingClient.empty ? 0 : existingClient.docs[0].data().bookings || 0) + 1,
    })

    await db.collection('bookingLogs').add({
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
    const db = await getDb()
    await db.collection('evidence').add({
      ...data,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Failed to log evidence:', e)
  }
}
