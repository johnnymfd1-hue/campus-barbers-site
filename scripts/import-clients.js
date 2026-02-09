/**
 * Campus Barbers - Client Import Script
 * 
 * Imports clients from Setmore CSV export into Firestore.
 * Auto-flags clients with 2+ no-shows to the Do Not Book list.
 * 
 * Usage:
 * 1. Place your CSV file as 'clients.csv' in project root
 * 2. Set up Firebase Admin credentials in .env.local
 * 3. Run: node scripts/import-clients.js
 */

const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')
const admin = require('firebase-admin')

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = admin.firestore()

// Configuration
const CSV_FILE = process.argv[2] || 'clients.csv'
const NO_SHOW_THRESHOLD = 2 // Auto-flag if no-shows >= this
const BATCH_SIZE = 500 // Firestore batch limit

function normalizePhone(phone) {
  if (!phone) return ''
  return phone.replace(/\D/g, '').slice(-10)
}

function normalizeEmail(email) {
  if (!email) return ''
  return email.toLowerCase().trim()
}

async function importClients() {
  console.log('🏁 Starting client import...')
  console.log(`📄 Reading from: ${CSV_FILE}`)

  // Read CSV
  const csvPath = path.resolve(CSV_FILE)
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  console.log(`📊 Found ${records.length} records`)

  // Process in batches
  let batch = db.batch()
  let batchCount = 0
  let totalImported = 0
  let totalFlagged = 0
  let totalSkipped = 0

  for (const record of records) {
    // Skip records with no usable identifier
    if (!record.Phone && !record.Email && record.Name === 'N/A') {
      totalSkipped++
      continue
    }

    const normalizedPhone = normalizePhone(record.Phone)
    const normalizedEmail = normalizeEmail(record.Email)

    // Parse numbers
    const bookings = parseInt(record.Bookings) || 0
    const completed = parseInt(record.Completed) || 0
    const noShows = parseInt(record.NoShows) || 0
    const cancellations = parseInt(record.Cancellations) || 0

    // Create client document
    const clientRef = db.collection('clients').doc()
    const clientData = {
      name: record.Name || 'Unknown',
      phone: record.Phone || '',
      normalizedPhone,
      email: record.Email || '',
      normalizedEmail,
      verified: record.Verified === 'Yes',
      bookings,
      completed,
      noShows,
      cancellations,
      lastVisit: record.Last_Visit || '',
      teamMembers: record.Team_Members || '',
      flagReason: record.Flag_Reason || '',
      importedAt: new Date().toISOString(),
      notes: '',
    }

    batch.set(clientRef, clientData)

    // Create public-facing record (name only)
    const publicRef = db.collection('clientsPublic').doc(clientRef.id)
    batch.set(publicRef, {
      name: record.Name || 'Unknown',
      lastVisit: record.Last_Visit || '',
    })

    // Auto-flag to DNB if high no-shows
    if (noShows >= NO_SHOW_THRESHOLD && (normalizedPhone || normalizedEmail)) {
      const dnbRef = db.collection('doNotBook').doc()
      batch.set(dnbRef, {
        clientId: clientRef.id,
        name: record.Name || 'Unknown',
        phone: record.Phone || '',
        normalizedPhone,
        email: record.Email || '',
        normalizedEmail,
        reason: `Auto-flagged: ${noShows} no-shows (imported from Setmore)`,
        addedAt: new Date().toISOString(),
        addedBy: 'import-script',
      })
      totalFlagged++
    }

    batchCount++
    totalImported++

    // Commit batch when it reaches limit
    if (batchCount >= BATCH_SIZE) {
      console.log(`💾 Committing batch (${totalImported} total)...`)
      await batch.commit()
      batch = db.batch()
      batchCount = 0
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    console.log(`💾 Committing final batch...`)
    await batch.commit()
  }

  console.log('')
  console.log('✅ Import complete!')
  console.log(`   📥 Imported: ${totalImported} clients`)
  console.log(`   🚫 Auto-flagged DNB: ${totalFlagged} clients`)
  console.log(`   ⏭️  Skipped: ${totalSkipped} records`)
  console.log('')
  console.log('🔒 Security reminder:')
  console.log('   - Staff can only see client NAMES')
  console.log('   - Only Admin can see phone/email/notes')
  console.log('   - DNB list blocks silent bookings')
}

// Run
importClients()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Import failed:', err)
    process.exit(1)
  })
