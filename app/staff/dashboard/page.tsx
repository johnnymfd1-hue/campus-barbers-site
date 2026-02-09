'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import Link from 'next/link'
import AgreementGate from '@/components/AgreementGate'

interface Appointment {
  id: string
  clientName: string
  service: string
  barberId: string
  date: string
  time: string
  status: 'confirmed' | 'completed' | 'no-show' | 'cancelled'
}

interface AgreementRecord {
  fullName: string
  signedAt: { seconds: number }
  agreementVersion: string
}

export default function StaffDashboard() {
  const [user, setUser] = useState<{ email: string; uid: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [agreementSigned, setAgreementSigned] = useState<boolean | null>(null)
  const [agreementRecord, setAgreementRecord] = useState<AgreementRecord | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ email: firebaseUser.email || '', uid: firebaseUser.uid })
        setLoading(false)
      } else {
        router.push('/staff')
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!user) return
    const checkAgreement = async () => {
      try {
        const agreementRef = doc(db, 'agreements', user.uid)
        const agreementSnap = await getDoc(agreementRef)
        if (agreementSnap.exists()) {
          setAgreementSigned(true)
          setAgreementRecord(agreementSnap.data() as AgreementRecord)
        } else {
          setAgreementSigned(false)
        }
      } catch (err) {
        console.error('Error checking agreement:', err)
        setAgreementSigned(false)
      }
    }
    checkAgreement()
  }, [user])

  useEffect(() => {
    if (!user || !agreementSigned) return
    const appointmentsRef = collection(db, 'appointments')
    const q = query(appointmentsRef, where('date', '==', selectedDate), orderBy('time', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appts: Appointment[] = snapshot.docs.map((d) => ({
        id: d.id,
        clientName: d.data().clientName,
        service: d.data().service,
        barberId: d.data().barberId,
        date: d.data().date,
        time: d.data().time,
        status: d.data().status,
      }))
      setAppointments(appts)
    })
    return () => unsubscribe()
  }, [user, selectedDate, agreementSigned])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/staff')
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'no-show': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDateOptions = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      })
    }
    return dates
  }

  if (loading || agreementSigned === null) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-spartan-500">
          <svg className="w-8 h-8 spinner mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>
    )
  }

  if (!agreementSigned && user) {
    return (
      <AgreementGate
        userEmail={user.email}
        userId={user.uid}
        onAccepted={() => {
          setAgreementSigned(true)
          getDoc(doc(db, 'agreements', user.uid)).then((snap) => {
            if (snap.exists()) setAgreementRecord(snap.data() as AgreementRecord)
          })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-spartan-500 text-cream py-4 px-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                <span className="font-display font-bold text-spartan-500 text-lg">CB</span>
              </div>
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold">Staff Dashboard</h1>
              <p className="text-cream/60 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/staff/agreement" className="text-cream/70 hover:text-cream transition-colors text-sm underline">View Agreement</Link>
            <button onClick={handleLogout} className="text-cream/70 hover:text-cream transition-colors text-sm">Sign Out</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {agreementRecord && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
            <span>Agreement signed by <strong>{agreementRecord.fullName}</strong> on{' '}
              {agreementRecord.signedAt?.seconds
                ? new Date(agreementRecord.signedAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                : 'date pending'}
            </span>
            <Link href="/staff/agreement" className="text-green-700 underline font-medium">View</Link>
          </div>
        )}
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold text-spartan-500 mb-3">Select Date</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {getDateOptions().map((date) => (
              <button key={date.value} onClick={() => setSelectedDate(date.value)} className={`px-4 py-2 whitespace-nowrap border-2 transition-all duration-200 ${selectedDate === date.value ? 'border-spartan-500 bg-spartan-500 text-cream' : 'border-spartan-500/20 hover:border-spartan-500/40 text-charcoal'}`}>
                {date.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold text-spartan-500">Appointments</h2>
            <span className="text-charcoal/60">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
          </div>
          {appointments.length === 0 ? (
            <div className="bg-white border-2 border-spartan-500/10 p-12 text-center">
              <svg className="w-16 h-16 text-charcoal/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-charcoal/60">No appointments scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-white border-2 border-spartan-500/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <p className="font-display text-xl font-bold text-spartan-500">{formatTime(appt.time)}</p>
                    </div>
                    <div className="border-l-2 border-spartan-500/10 pl-4">
                      <p className="font-semibold text-charcoal text-lg">{appt.clientName}</p>
                      <p className="text-charcoal/60">{appt.service}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium capitalize ${getStatusColor(appt.status)}`}>{appt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-8 p-4 bg-gold/10 border border-gold/30 text-sm text-charcoal/70">
          <p><strong>Note:</strong> For client contact information or to mark appointments as completed/no-show, please contact the shop owner.</p>
        </div>
      </main>
    </div>
  )
}
