'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import Link from 'next/link'

interface AgreementRecord {
  fullName: string
  email: string
  signedAt: { seconds: number }
  agreementVersion: string
  userAgent: string
}

export default function ViewAgreementPage() {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [agreement, setAgreement] = useState<AgreementRecord | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email || '' })
        const agreementSnap = await getDoc(doc(db, 'agreements', firebaseUser.uid))
        if (agreementSnap.exists()) {
          setAgreement(agreementSnap.data() as AgreementRecord)
        } else {
          router.push('/staff/dashboard')
        }
        setLoading(false)
      } else {
        router.push('/staff')
      }
    })
    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-spartan-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-spartan-500 text-cream py-4 px-6 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/staff/dashboard" className="text-cream/70 hover:text-cream transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-lg font-bold">Signed Agreement</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-6">
        {agreement && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 p-6">
            <h2 className="font-display font-bold text-green-800 text-lg mb-3">Signature Record</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-green-700/60">Signed By</p>
                <p className="font-semibold text-green-900">{agreement.fullName}</p>
              </div>
              <div>
                <p className="text-green-700/60">Email</p>
                <p className="font-semibold text-green-900">{agreement.email}</p>
              </div>
              <div>
                <p className="text-green-700/60">Date &amp; Time</p>
                <p className="font-semibold text-green-900">
                  {agreement.signedAt?.seconds
                    ? new Date(agreement.signedAt.seconds * 1000).toLocaleString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: 'numeric', minute: '2-digit', second: '2-digit',
                        timeZoneName: 'short'
                      })
                    : 'Pending'
                  }
                </p>
              </div>
              <div>
                <p className="text-green-700/60">Agreement Version</p>
                <p className="font-semibold text-green-900">{agreement.agreementVersion}</p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white border-2 border-spartan-500/10 p-8 text-sm leading-relaxed">
          <h2 className="text-center font-bold text-lg mb-1">CAMPUS BARBERS INC.</h2>
          <h3 className="text-center font-bold text-base mb-1">NON-SOLICITATION, CONFIDENTIALITY, AND DATA ACCESS AGREEMENT</h3>
          <p className="text-center text-xs text-charcoal/60 mb-6">(Independent Contractor — Chair Rental)</p>
          <p className="mb-4">This Non-Solicitation, Confidentiality, and Data Access Agreement (this <strong>&quot;Agreement&quot;</strong>) is entered into as of the date of electronic acceptance below (the <strong>&quot;Effective Date&quot;</strong>), by and between:</p>
          <p className="mb-2 ml-4"><strong>Campus Barbers Inc.</strong>, a Michigan corporation, located at 621 E. Grand River Avenue, East Lansing, Michigan 48823 (the <strong>&quot;Company&quot;</strong>); and</p>
          <p className="mb-4 ml-4">The undersigned independent contractor operating under a Chair Rental Agreement with the Company (the <strong>&quot;Contractor&quot;</strong>).</p>
          <p className="text-center text-xs text-charcoal/40 mt-8">Full agreement text is identical to the version presented at time of signing. A complete copy is maintained by Campus Barbers Inc.</p>
        </div>
        <div className="mt-6 text-center">
          <Link href="/staff/dashboard" className="text-spartan-500 hover:underline font-medium">← Return to Dashboard</Link>
        </div>
      </main>
    </div>
  )
}
