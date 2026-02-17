#!/usr/bin/env node

/**
 * Campus Barbers Inc. - PNL (Profit & Loss) Report
 *
 * Run from terminal:
 *   node scripts/pnl-report.js                    # Current month
 *   node scripts/pnl-report.js 2026-01             # January 2026
 *   node scripts/pnl-report.js 2026-01 2026-02     # Jan-Feb range
 *   node scripts/pnl-report.js --expenses           # Set/update monthly expenses
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// ─────────────────────────────────────────────
// SERVICE PRICING (matches BookingForm.tsx)
// ─────────────────────────────────────────────
const SERVICE_PRICES = {
  'Regular Haircut': 30,
  'Senior Cut': 25,
  'Kids Cut': 25,
  'Beard Trim': 15,
  'Haircut + Beard': 40,
}

// Fallback if service name doesn't match exactly
function getServicePrice(serviceName) {
  if (SERVICE_PRICES[serviceName]) return SERVICE_PRICES[serviceName]
  // Fuzzy match
  const lower = serviceName.toLowerCase()
  if (lower.includes('beard') && lower.includes('hair')) return 40
  if (lower.includes('regular') || lower.includes('haircut')) return 30
  if (lower.includes('senior')) return 25
  if (lower.includes('kid')) return 25
  if (lower.includes('beard')) return 15
  return 30 // default to regular haircut
}

// ─────────────────────────────────────────────
// EXPENSES FILE (persisted locally)
// ─────────────────────────────────────────────
const EXPENSES_FILE = path.join(__dirname, '..', '.pnl-expenses.json')

function loadExpenses() {
  try {
    if (fs.existsSync(EXPENSES_FILE)) {
      return JSON.parse(fs.readFileSync(EXPENSES_FILE, 'utf8'))
    }
  } catch (e) { /* ignore */ }
  return {
    monthly: {
      rent: 0,
      utilities: 0,
      insurance: 0,
      supplies: 0,
      payroll_nicholas: 0,
      payroll_jason: 0,
      software_subscriptions: 0,
      marketing: 0,
      other: 0,
    },
    notes: 'Run: node scripts/pnl-report.js --expenses  to update these values'
  }
}

function saveExpenses(expenses) {
  fs.writeFileSync(EXPENSES_FILE, JSON.stringify(expenses, null, 2))
}

// ─────────────────────────────────────────────
// FIREBASE INIT
// ─────────────────────────────────────────────
function initFirebase() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!serviceAccountKey && !projectId) {
    console.error('\n  ERROR: Firebase credentials not found.')
    console.error('  Set FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local\n')
    console.error('  To load your .env.local, run:')
    console.error('    export $(cat .env.local | grep -v "^#" | xargs)\n')
    process.exit(1)
  }

  const config = {}
  if (serviceAccountKey) {
    config.credential = cert(JSON.parse(serviceAccountKey))
  }
  if (projectId) {
    config.projectId = projectId
  }

  const app = initializeApp(config, 'pnl-report')
  return getFirestore(app)
}

// ─────────────────────────────────────────────
// FETCH APPOINTMENTS FOR DATE RANGE
// ─────────────────────────────────────────────
async function fetchAppointments(db, startDate, endDate) {
  const snapshot = await db.collection('appointments')
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get()

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

// ─────────────────────────────────────────────
// FETCH CLIENT STATS
// ─────────────────────────────────────────────
async function fetchClientStats(db) {
  const snapshot = await db.collection('clients').get()
  return {
    total: snapshot.size,
    clients: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
}

// ─────────────────────────────────────────────
// GENERATE PNL REPORT
// ─────────────────────────────────────────────
function generateReport(appointments, expenses, startDate, endDate, clientStats) {
  const line = '═'.repeat(58)
  const thinLine = '─'.repeat(58)

  // Categorize appointments by status
  const completed = appointments.filter(a => a.status === 'completed')
  const confirmed = appointments.filter(a => a.status === 'confirmed')
  const noShows = appointments.filter(a => a.status === 'no-show')
  const cancelled = appointments.filter(a => a.status === 'cancelled')

  // Calculate revenue from completed appointments
  let completedRevenue = 0
  const serviceBreakdown = {}
  const barberBreakdown = {}

  completed.forEach(apt => {
    const price = getServicePrice(apt.service)
    completedRevenue += price

    // Service breakdown
    if (!serviceBreakdown[apt.service]) {
      serviceBreakdown[apt.service] = { count: 0, revenue: 0 }
    }
    serviceBreakdown[apt.service].count++
    serviceBreakdown[apt.service].revenue += price

    // Barber breakdown
    const barber = apt.barberId || 'Unassigned'
    if (!barberBreakdown[barber]) {
      barberBreakdown[barber] = { count: 0, revenue: 0 }
    }
    barberBreakdown[barber].count++
    barberBreakdown[barber].revenue += price
  })

  // Projected revenue from confirmed (not yet completed)
  let projectedRevenue = 0
  confirmed.forEach(apt => {
    projectedRevenue += getServicePrice(apt.service)
  })

  // Lost revenue from no-shows
  let lostRevenue = 0
  noShows.forEach(apt => {
    lostRevenue += getServicePrice(apt.service)
  })

  // Total expenses
  const totalExpenses = Object.values(expenses.monthly).reduce((sum, val) => sum + val, 0)

  // Net profit
  const netProfit = completedRevenue - totalExpenses

  // ─── BUILD REPORT ───
  let report = '\n'
  report += `  ${line}\n`
  report += `  ║  CAMPUS BARBERS INC. — PROFIT & LOSS REPORT          ║\n`
  report += `  ║  621 E Grand River Ave, East Lansing, MI 48823       ║\n`
  report += `  ${line}\n`
  report += `  Period: ${startDate} to ${endDate}\n`
  report += `  Generated: ${new Date().toLocaleString()}\n`
  report += `  ${thinLine}\n\n`

  // ─── REVENUE SECTION ───
  report += `  REVENUE\n`
  report += `  ${thinLine}\n`
  report += `  Completed Services:              $${completedRevenue.toLocaleString().padStart(10)}\n`
  report += `  Pending/Confirmed:               $${projectedRevenue.toLocaleString().padStart(10)}  (projected)\n`
  report += `  Lost to No-Shows:               -$${lostRevenue.toLocaleString().padStart(10)}\n`
  report += `  ${thinLine}\n`
  report += `  TOTAL EARNED REVENUE:            $${completedRevenue.toLocaleString().padStart(10)}\n\n`

  // ─── SERVICE BREAKDOWN ───
  report += `  REVENUE BY SERVICE\n`
  report += `  ${thinLine}\n`
  const sortedServices = Object.entries(serviceBreakdown).sort((a, b) => b[1].revenue - a[1].revenue)
  if (sortedServices.length === 0) {
    report += `  (No completed appointments in this period)\n`
  }
  sortedServices.forEach(([service, data]) => {
    const pct = ((data.revenue / completedRevenue) * 100).toFixed(0)
    report += `  ${service.padEnd(30)} ${String(data.count).padStart(4)} cuts   $${data.revenue.toLocaleString().padStart(8)}  (${pct}%)\n`
  })
  report += '\n'

  // ─── BARBER BREAKDOWN ───
  report += `  REVENUE BY BARBER\n`
  report += `  ${thinLine}\n`
  const sortedBarbers = Object.entries(barberBreakdown).sort((a, b) => b[1].revenue - a[1].revenue)
  if (sortedBarbers.length === 0) {
    report += `  (No completed appointments in this period)\n`
  }
  sortedBarbers.forEach(([barber, data]) => {
    const pct = ((data.revenue / completedRevenue) * 100).toFixed(0)
    report += `  ${barber.padEnd(30)} ${String(data.count).padStart(4)} cuts   $${data.revenue.toLocaleString().padStart(8)}  (${pct}%)\n`
  })
  report += '\n'

  // ─── EXPENSES SECTION ───
  report += `  EXPENSES (MONTHLY)\n`
  report += `  ${thinLine}\n`
  const expenseLabels = {
    rent: 'Rent',
    utilities: 'Utilities (electric/water/net)',
    insurance: 'Insurance',
    supplies: 'Supplies & Products',
    payroll_nicholas: 'Payroll — Nicholas',
    payroll_jason: 'Payroll — Jason',
    software_subscriptions: 'Software/Subscriptions',
    marketing: 'Marketing/Advertising',
    other: 'Other Expenses',
  }
  Object.entries(expenses.monthly).forEach(([key, val]) => {
    const label = expenseLabels[key] || key
    report += `  ${label.padEnd(35)} $${val.toLocaleString().padStart(10)}\n`
  })
  report += `  ${thinLine}\n`
  report += `  TOTAL EXPENSES:                  $${totalExpenses.toLocaleString().padStart(10)}\n\n`

  // ─── BOTTOM LINE ───
  report += `  ${line}\n`
  const profitLabel = netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'
  const profitSign = netProfit >= 0 ? '$' : '-$'
  const profitVal = Math.abs(netProfit)
  report += `  ║  ${profitLabel}:${' '.repeat(27)}${profitSign}${profitVal.toLocaleString().padStart(10)}  ║\n`
  report += `  ${line}\n\n`

  // ─── APPOINTMENT STATS ───
  report += `  APPOINTMENT STATS\n`
  report += `  ${thinLine}\n`
  report += `  Total Appointments:              ${String(appointments.length).padStart(10)}\n`
  report += `  Completed:                       ${String(completed.length).padStart(10)}\n`
  report += `  Confirmed/Pending:               ${String(confirmed.length).padStart(10)}\n`
  report += `  No-Shows:                        ${String(noShows.length).padStart(10)}\n`
  report += `  Cancelled:                       ${String(cancelled.length).padStart(10)}\n`
  if (appointments.length > 0) {
    const completionRate = ((completed.length / appointments.length) * 100).toFixed(1)
    const noShowRate = ((noShows.length / appointments.length) * 100).toFixed(1)
    report += `  Completion Rate:                 ${completionRate.padStart(9)}%\n`
    report += `  No-Show Rate:                    ${noShowRate.padStart(9)}%\n`
  }
  report += '\n'

  // ─── CLIENT STATS ───
  if (clientStats) {
    report += `  CLIENT DATABASE\n`
    report += `  ${thinLine}\n`
    report += `  Total Clients on File:           ${String(clientStats.total).padStart(10)}\n`

    // New clients this period
    const newClients = clientStats.clients.filter(c => {
      return c.createdAt && c.createdAt >= startDate && c.createdAt <= endDate + 'T23:59:59'
    })
    report += `  New Clients This Period:         ${String(newClients.length).padStart(10)}\n`

    // Avg revenue per completed appointment
    if (completed.length > 0) {
      const avgTicket = (completedRevenue / completed.length).toFixed(2)
      report += `  Avg Ticket (per cut):            $${avgTicket.padStart(9)}\n`
    }
    report += '\n'
  }

  // ─── KEY METRICS ───
  report += `  KEY BUSINESS METRICS\n`
  report += `  ${thinLine}\n`
  if (completedRevenue > 0 && totalExpenses > 0) {
    const margin = ((netProfit / completedRevenue) * 100).toFixed(1)
    report += `  Profit Margin:                   ${margin.padStart(9)}%\n`
    const breakEvenCuts = Math.ceil(totalExpenses / 30) // avg haircut price
    report += `  Break-Even Point:                ${String(breakEvenCuts).padStart(7)} cuts/mo\n`
  }

  // Daily averages
  const dayMs = 86400000
  const periodDays = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / dayMs) + 1)
  // Approximate working days (exclude Sundays)
  const workingDays = Math.round(periodDays * (6 / 7))
  if (completed.length > 0 && workingDays > 0) {
    const dailyAvg = (completedRevenue / workingDays).toFixed(0)
    const cutsPerDay = (completed.length / workingDays).toFixed(1)
    report += `  Working Days in Period:          ${String(workingDays).padStart(10)}\n`
    report += `  Avg Daily Revenue:               $${dailyAvg.padStart(9)}\n`
    report += `  Avg Cuts Per Day:                ${cutsPerDay.padStart(10)}\n`
  }
  report += '\n'

  // ─── TIPS ───
  if (totalExpenses === 0) {
    report += `  *** EXPENSES NOT SET ***\n`
    report += `  Run: node scripts/pnl-report.js --expenses\n`
    report += `  Or edit .pnl-expenses.json directly\n\n`
  }

  return report
}

// ─────────────────────────────────────────────
// INTERACTIVE EXPENSE SETUP
// ─────────────────────────────────────────────
async function setupExpenses() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q) => new Promise(resolve => rl.question(q, resolve))

  const expenses = loadExpenses()

  console.log('\n  ═══════════════════════════════════════════════════')
  console.log('  CAMPUS BARBERS — MONTHLY EXPENSE SETUP')
  console.log('  ═══════════════════════════════════════════════════')
  console.log('  Enter your monthly costs. Press Enter to keep current value.\n')

  const fields = {
    rent: 'Monthly rent',
    utilities: 'Utilities (electric, water, internet)',
    insurance: 'Business insurance',
    supplies: 'Supplies & products (blades, shampoo, etc)',
    payroll_nicholas: 'Payroll — Nicholas (monthly)',
    payroll_jason: 'Payroll — Jason (monthly)',
    software_subscriptions: 'Software/subscriptions (Square, website, etc)',
    marketing: 'Marketing/advertising',
    other: 'Other expenses',
  }

  for (const [key, label] of Object.entries(fields)) {
    const current = expenses.monthly[key] || 0
    const answer = await ask(`  ${label} [$${current}]: `)
    if (answer.trim()) {
      expenses.monthly[key] = parseFloat(answer.replace(/[$,]/g, '')) || 0
    }
  }

  saveExpenses(expenses)
  const total = Object.values(expenses.monthly).reduce((s, v) => s + v, 0)
  console.log(`\n  Saved! Total monthly expenses: $${total.toLocaleString()}`)
  console.log(`  File: ${EXPENSES_FILE}\n`)
  rl.close()
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)

  // Handle --expenses flag
  if (args.includes('--expenses')) {
    await setupExpenses()
    return
  }

  // Determine date range
  let startDate, endDate

  if (args.length >= 2) {
    // Range: node pnl-report.js 2026-01 2026-03
    startDate = args[0] + '-01'
    const endMonth = new Date(args[1] + '-01')
    endMonth.setMonth(endMonth.getMonth() + 1)
    endMonth.setDate(endMonth.getDate() - 1)
    endDate = endMonth.toISOString().split('T')[0]
  } else if (args.length === 1) {
    // Single month: node pnl-report.js 2026-01
    startDate = args[0] + '-01'
    const end = new Date(args[0] + '-01')
    end.setMonth(end.getMonth() + 1)
    end.setDate(end.getDate() - 1)
    endDate = end.toISOString().split('T')[0]
  } else {
    // Default: current month
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    startDate = `${year}-${month}-01`
    const end = new Date(year, now.getMonth() + 1, 0)
    endDate = end.toISOString().split('T')[0]
  }

  console.log(`\n  Loading data for ${startDate} to ${endDate}...`)

  // Init Firebase
  const db = initFirebase()
  const expenses = loadExpenses()

  // Fetch data
  const [appointments, clientStats] = await Promise.all([
    fetchAppointments(db, startDate, endDate),
    fetchClientStats(db),
  ])

  console.log(`  Found ${appointments.length} appointments.`)

  // Generate and print report
  const report = generateReport(appointments, expenses, startDate, endDate, clientStats)
  console.log(report)

  // Save to file
  const reportDir = path.join(__dirname, '..', 'reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  const filename = `pnl-${startDate}-to-${endDate}.txt`
  const filepath = path.join(reportDir, filename)
  fs.writeFileSync(filepath, report)
  console.log(`  Report saved to: reports/${filename}\n`)

  process.exit(0)
}

main().catch(err => {
  console.error('\n  ERROR:', err.message)
  if (err.message.includes('credentials') || err.message.includes('FIREBASE')) {
    console.error('\n  Make sure your Firebase credentials are loaded:')
    console.error('    export $(cat .env.local | grep -v "^#" | xargs)')
    console.error('    node scripts/pnl-report.js\n')
  }
  process.exit(1)
})
