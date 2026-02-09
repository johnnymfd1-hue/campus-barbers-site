'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, addDoc, deleteDoc, limit } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  phone: string
  email: string
  bookings: number
  noShows: number
  cancellations: number
  notes: string
  lastVisit: string
}

interface Appointment {
  id: string
  clientId: string
  clientName: string
  service: string
  barberId: string
  date: string
  time: string
  status: string
  notes: string
  createdAt: string
}

interface EvidenceRecord {
  id: string
  type: string
  ip: string
  userAgent: string
  timestamp: string
  data?: Record<string, unknown>
}

interface DNBEntry {
  id: string
  name: string
  phone: string
  email: string
  reason: string
  addedAt: string
}

type Tab = 'appointments' | 'clients' | 'dnb' | 'evidence'

export default function AdminDashboard() {
  const [user, setUser] = useState<{ email: string; uid: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('appointments')
  
  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [dnbList, setDnbList] = useState<DNBEntry[]>([])
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([])
  
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  
  const router = useRouter()

  // Auth check with admin verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Verify admin role
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser({ email: firebaseUser.email || '', uid: firebaseUser.uid })
          setLoading(false)
        } else {
          router.push('/admin')
        }
      } else {
        router.push('/admin')
      }
    })
    return () => unsubscribe()
  }, [router])

  // Fetch appointments
  useEffect(() => {
    if (!user || activeTab !== 'appointments') return

    const q = query(
      collection(db, 'appointments'),
      where('date', '==', selectedDate),
      orderBy('time', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[]
      setAppointments(appts)
    })

    return () => unsubscribe()
  }, [user, activeTab, selectedDate])

  // Fetch clients
  useEffect(() => {
    if (!user || activeTab !== 'clients') return

    const q = query(
      collection(db, 'clients'),
      orderBy('lastVisit', 'desc'),
      limit(100)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[]
      setClients(clientList)
    })

    return () => unsubscribe()
  }, [user, activeTab])

  // Fetch DNB list
  useEffect(() => {
    if (!user || activeTab !== 'dnb') return

    const unsubscribe = onSnapshot(collection(db, 'doNotBook'), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DNBEntry[]
      setDnbList(list)
    })

    return () => unsubscribe()
  }, [user, activeTab])

  // Fetch evidence
  useEffect(() => {
    if (!user || activeTab !== 'evidence') return

    const q = query(
      collection(db, 'evidence'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EvidenceRecord[]
      setEvidence(records)
    })

    return () => unsubscribe()
  }, [user, activeTab])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/admin')
  }

  const updateAppointmentStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'appointments', id), { status })
  }

  const addToDNB = async (client: Client, reason: string) => {
    await addDoc(collection(db, 'doNotBook'), {
      name: client.name,
      phone: client.phone,
      normalizedPhone: client.phone.replace(/\D/g, '').slice(-10),
      email: client.email || '',
      normalizedEmail: client.email?.toLowerCase().trim() || '',
      reason,
      addedAt: new Date().toISOString(),
      addedBy: user?.email,
    })
  }

  const removeFromDNB = async (id: string) => {
    await deleteDoc(doc(db, 'doNotBook', id))
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-cream">
          <svg className="w-8 h-8 spinner mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <header className="bg-spartan-500 text-cream py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                <span className="font-display font-bold text-spartan-500 text-lg">CB</span>
              </div>
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold">Admin Dashboard</h1>
              <p className="text-gold text-sm">Full Access</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-cream/70 hover:text-cream transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-spartan-600 border-b border-cream/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {(['appointments', 'clients', 'dnb', 'evidence'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-charcoal text-cream border-t-2 border-gold'
                    : 'text-cream/60 hover:text-cream'
                }`}
              >
                {tab === 'dnb' ? 'Do Not Book' : tab === 'evidence' ? 'Evidence Box' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-cream/10 border border-cream/20 text-cream px-4 py-2"
              />
              <span className="text-cream/60">
                {appointments.length} appointments
              </span>
            </div>

            <div className="space-y-3">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-cream/5 border border-cream/10 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[80px]">
                      <p className="font-display text-xl font-bold text-gold">
                        {formatTime(appt.time)}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-cream text-lg">{appt.clientName}</p>
                      <p className="text-cream/60">{appt.service}</p>
                      {appt.notes && (
                        <p className="text-cream/40 text-sm mt-1">Notes: {appt.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={appt.status}
                      onChange={(e) => updateAppointmentStatus(appt.id, e.target.value)}
                      className="bg-cream/10 border border-cream/20 text-cream px-3 py-1 text-sm"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="no-show">No-Show</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <div className="text-center py-12 text-cream/40">
                  No appointments for this date.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div>
            <div className="mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full max-w-md bg-cream/10 border border-cream/20 text-cream px-4 py-2 placeholder:text-cream/40"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-cream/10 text-cream/60 text-sm">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Bookings</th>
                    <th className="pb-3 font-medium">No-Shows</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-cream/5 text-cream">
                      <td className="py-3 font-medium">{client.name}</td>
                      <td className="py-3 text-gold">{client.phone}</td>
                      <td className="py-3 text-cream/60">{client.email || '-'}</td>
                      <td className="py-3">{client.bookings || 0}</td>
                      <td className="py-3">
                        <span className={client.noShows > 2 ? 'text-red-400 font-bold' : ''}>
                          {client.noShows || 0}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => addToDNB(client, 'Manual block by admin')}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Block
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DNB Tab */}
        {activeTab === 'dnb' && (
          <div>
            <h2 className="font-display text-2xl font-bold text-cream mb-6">
              Do Not Book List
              <span className="text-cream/40 text-lg font-normal ml-2">
                ({dnbList.length} blocked)
              </span>
            </h2>

            <div className="space-y-3">
              {dnbList.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-red-500/10 border border-red-500/30 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-cream">{entry.name}</p>
                    <p className="text-cream/60 text-sm">
                      {entry.phone} • {entry.email || 'No email'}
                    </p>
                    <p className="text-red-400 text-sm mt-1">Reason: {entry.reason}</p>
                    <p className="text-cream/40 text-xs mt-1">
                      Blocked: {formatDate(entry.addedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromDNB(entry.id)}
                    className="text-cream/60 hover:text-cream text-sm border border-cream/20 px-3 py-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {dnbList.length === 0 && (
                <div className="text-center py-12 text-cream/40">
                  No blocked clients.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div>
            <h2 className="font-display text-2xl font-bold text-cream mb-2">
              Evidence Box
            </h2>
            <p className="text-cream/60 mb-6">
              Honeypot triggers, blocked attempts, and suspicious activity.
            </p>

            <div className="space-y-3">
              {evidence.map((record) => (
                <div
                  key={record.id}
                  className={`border p-4 ${
                    record.type === 'honeypot' 
                      ? 'bg-yellow-500/10 border-yellow-500/30' 
                      : record.type === 'dnb_blocked'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-cream/5 border-cream/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium uppercase ${
                      record.type === 'honeypot' 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : record.type === 'dnb_blocked'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-cream/10 text-cream/60'
                    }`}>
                      {record.type}
                    </span>
                    <span className="text-cream/40 text-sm">
                      {formatDate(record.timestamp)}
                    </span>
                  </div>
                  <div className="text-cream/80 text-sm font-mono">
                    <p><span className="text-cream/40">IP:</span> {record.ip}</p>
                    <p className="truncate"><span className="text-cream/40">UA:</span> {record.userAgent}</p>
                    {record.data && (
                      <details className="mt-2">
                        <summary className="text-gold cursor-pointer">View Data</summary>
                        <pre className="mt-2 p-2 bg-charcoal/50 overflow-x-auto text-xs">
                          {JSON.stringify(record.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
              {evidence.length === 0 && (
                <div className="text-center py-12 text-cream/40">
                  No evidence records yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
