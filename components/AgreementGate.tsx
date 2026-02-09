'use client'

import { useState, useRef } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface AgreementGateProps {
  userEmail: string
  userId: string
  onAccepted: () => void
}

export default function AgreementGate({ userEmail, userId, onAccepted }: AgreementGateProps) {
  const [fullName, setFullName] = useState('')
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setScrolledToBottom(true)
    }
  }

  const handleAccept = async () => {
    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      setError('Please enter your full legal name (first and last).')
      return
    }
    if (!acknowledged) {
      setError('You must acknowledge that you have read and agree to the terms.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await setDoc(doc(db, 'agreements', userId), {
        userId,
        email: userEmail,
        fullName: fullName.trim(),
        agreementVersion: '2025-02-09-v1',
        signedAt: serverTimestamp(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ipNote: 'IP logged server-side via Vercel headers',
      })
      onAccepted()
    } catch (err) {
      console.error('Error saving agreement:', err)
      setError('Failed to save agreement. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-spartan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-cream">
        <div className="bg-spartan-500 text-cream p-6 text-center">
          <div className="w-14 h-14 bg-gold rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="font-display font-bold text-spartan-500 text-2xl">CB</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Non-Solicitation &amp; Confidentiality Agreement</h1>
          <p className="text-cream/70 mt-1 text-sm">Campus Barbers Inc. — Required Before Portal Access</p>
        </div>
        <div className="p-6">
          <p className="text-sm text-charcoal/60 mb-3 font-medium">Read the entire agreement below. You must scroll to the bottom before signing.</p>
          <div ref={scrollRef} onScroll={handleScroll} className="h-[400px] overflow-y-auto border-2 border-spartan-500/20 p-6 bg-white text-sm leading-relaxed text-charcoal">
            <h2 className="text-center font-bold text-lg mb-1">CAMPUS BARBERS INC.</h2>
            <h3 className="text-center font-bold text-base mb-1">NON-SOLICITATION, CONFIDENTIALITY, AND DATA ACCESS AGREEMENT</h3>
            <p className="text-center text-xs text-charcoal/60 mb-6">(Independent Contractor — Chair Rental)</p>
            <p className="mb-4">This Non-Solicitation, Confidentiality, and Data Access Agreement (this <strong>&quot;Agreement&quot;</strong>) is entered into as of the date of electronic acceptance below (the <strong>&quot;Effective Date&quot;</strong>), by and between:</p>
            <p className="mb-2 ml-4"><strong>Campus Barbers Inc.</strong>, a Michigan corporation, located at 621 E. Grand River Avenue, East Lansing, Michigan 48823 (the <strong>&quot;Company&quot;</strong>); and</p>
            <p className="mb-4 ml-4">The undersigned independent contractor operating under a Chair Rental Agreement with the Company (the <strong>&quot;Contractor&quot;</strong>).</p>
            <p className="mb-6">The Company and Contractor are collectively referred to as the &quot;Parties&quot; and individually as a &quot;Party.&quot;</p>
            <h3 className="font-bold text-center underline mb-4">RECITALS</h3>
            <p className="mb-3"><strong>WHEREAS,</strong> the Company owns and operates Campus Barbers, a barbershop in continuous operation since 1952, and has invested substantial time, effort, and resources in developing and maintaining a proprietary client database currently consisting of approximately 7,562 verified client records (the <strong>&quot;Client Database&quot;</strong>);</p>
            <p className="mb-3"><strong>WHEREAS,</strong> the Contractor rents a chair from the Company pursuant to a separate Chair Rental Agreement and operates as an independent contractor providing barbering services at the Company&apos;s premises;</p>
            <p className="mb-3"><strong>WHEREAS,</strong> the Company is granting the Contractor limited access to a secure staff portal (the <strong>&quot;Staff Portal&quot;</strong>) for the sole purpose of viewing appointments, schedules, and limited client information necessary to perform barbering services;</p>
            <p className="mb-3"><strong>WHEREAS,</strong> the Client Database, booking systems, scheduling data, client contact information, service histories, and pricing structures constitute valuable trade secrets and proprietary business information of the Company under the Michigan Uniform Trade Secrets Act (MCL 445.1901 et seq.);</p>
            <p className="mb-3"><strong>WHEREAS,</strong> the Contractor acknowledges that the Company&apos;s client relationships are the result of years of goodwill, reputation, and investment, and that access to such information creates a duty of good faith and fair dealing;</p>
            <p className="mb-6"><strong>NOW, THEREFORE,</strong> in consideration of the Company granting the Contractor access to the Staff Portal and Confidential Information, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:</p>
            <h3 className="font-bold mb-3">ARTICLE 1 — DEFINITIONS</h3>
            <p className="mb-3"><strong>1.1 &quot;Confidential Information&quot;</strong> means all non-public information relating to the Company&apos;s business, including but not limited to: (a) client names, contact information (phone numbers, email addresses, mailing addresses), appointment histories, service preferences, and notes; (b) pricing strategies, revenue data, and financial information; (c) booking system data, Setmore configurations, and scheduling algorithms; (d) business methods, marketing strategies, and operational procedures; (e) staff information, compensation arrangements, and chair rental terms; and (f) any information designated as confidential by the Company, whether disclosed orally, in writing, electronically, or through access to the Staff Portal.</p>
            <p className="mb-3"><strong>1.2 &quot;Client&quot;</strong> means any individual who: (a) has received barbering services at Campus Barbers at any time during the 24 months preceding the Effective Date or during the Term; (b) is listed in the Client Database or any Company booking system; or (c) has made an appointment or inquiry with Campus Barbers during such period.</p>
            <p className="mb-3"><strong>1.3 &quot;Prospective Client&quot;</strong> means any individual with whom the Company has had communications regarding potential services within the 12 months preceding the Effective Date or during the Term.</p>
            <p className="mb-3"><strong>1.4 &quot;Restricted Period&quot;</strong> means the period commencing on the Effective Date and ending twenty-four (24) months after the date on which the Contractor&apos;s Chair Rental Agreement with the Company terminates or expires for any reason.</p>
            <p className="mb-3"><strong>1.5 &quot;Restricted Area&quot;</strong> means the area within a five (5) mile radius of 621 E. Grand River Avenue, East Lansing, Michigan 48823.</p>
            <p className="mb-3"><strong>1.6 &quot;Term&quot;</strong> means the period during which the Contractor maintains a Chair Rental Agreement with the Company and has access to the Staff Portal.</p>
            <h3 className="font-bold mb-3 mt-6">ARTICLE 2 — CONFIDENTIALITY OBLIGATIONS</h3>
            <p className="mb-3"><strong>2.1 Non-Disclosure.</strong> The Contractor shall not, during the Term or at any time thereafter, directly or indirectly, disclose, publish, communicate, or make available any Confidential Information to any third party without the prior written consent of the Company. This obligation survives termination of this Agreement and the Chair Rental Agreement in perpetuity.</p>
            <p className="mb-3"><strong>2.2 Standard of Care.</strong> The Contractor shall protect Confidential Information using at least the same degree of care that the Contractor uses to protect their own most sensitive information, but in no event less than a reasonable degree of care.</p>
            <p className="mb-3"><strong>2.3 Permitted Use.</strong> The Contractor may use Confidential Information solely for the purpose of performing barbering services at Campus Barbers during the Term. No other use is authorized.</p>
            <p className="mb-3"><strong>2.4 No Ownership.</strong> The Contractor acknowledges and agrees that all Confidential Information, including but not limited to all client data, client relationships developed through the Company&apos;s platform and premises, and all goodwill associated therewith, is and shall remain the sole and exclusive property of the Company.</p>
            <p className="mb-3"><strong>2.5 Return of Materials.</strong> Upon termination of the Chair Rental Agreement, or upon the Company&apos;s request at any time, the Contractor shall immediately: (a) return all materials containing Confidential Information; (b) permanently delete all electronic copies; and (c) certify in writing that all such information has been returned or destroyed.</p>
            <h3 className="font-bold mb-3 mt-6">ARTICLE 3 — DATA ACCESS AND SECURITY</h3>
            <p className="mb-3"><strong>3.1 Limited Access.</strong> The Company grants the Contractor limited, revocable, non-transferable, non-exclusive access to the Staff Portal solely for the purposes of: (a) viewing the Contractor&apos;s own appointment schedule; (b) accessing client first names and appointment times necessary to perform scheduled services; and (c) such other functions as the Company may authorize in writing.</p>
            <p className="mb-3"><strong>3.2 Prohibited Activities.</strong> The Contractor shall not, under any circumstances:</p>
            <p className="mb-1 ml-6">(a) Copy, download, screenshot, photograph, transcribe, export, scrape, or otherwise reproduce any data from the Staff Portal or any Company system;</p>
            <p className="mb-1 ml-6">(b) Attempt to access data beyond the Contractor&apos;s authorized access level;</p>
            <p className="mb-1 ml-6">(c) Share login credentials with any third party;</p>
            <p className="mb-1 ml-6">(d) Use any automated tools, scripts, or software to access the Staff Portal;</p>
            <p className="mb-1 ml-6">(e) Attempt to reverse engineer or circumvent any security measures; or</p>
            <p className="mb-3 ml-6">(f) Transfer any data obtained through the Staff Portal to any personal device, account, or third-party system.</p>
            <p className="mb-3"><strong>3.3 Credential Security.</strong> The Contractor shall use a unique strong password, enable MFA if required, not share credentials, and immediately notify the Company of any suspected unauthorized access.</p>
            <p className="mb-3"><strong>3.4 Monitoring and Audit.</strong> The Contractor acknowledges and consents that the Company may monitor, log, and audit all activity on the Staff Portal. The Company reserves the right to revoke access at any time, for any reason, with or without notice.</p>
            <p className="mb-3"><strong>3.5 Revocation.</strong> The Company may revoke, suspend, or limit access to the Staff Portal at any time, in its sole discretion, with or without cause or prior notice. Revocation shall not constitute a breach of the Chair Rental Agreement.</p>
            <h3 className="font-bold mb-3 mt-6">ARTICLE 4 — NON-SOLICITATION</h3>
            <p className="mb-3"><strong>4.1 Non-Solicitation of Clients.</strong> During the Restricted Period, the Contractor shall not, directly or indirectly:</p>
            <p className="mb-1 ml-6">(a) Solicit, contact, call, text, email, message through social media, or otherwise communicate with any Client or Prospective Client for the purpose of providing barbering, grooming, or personal care services;</p>
            <p className="mb-1 ml-6">(b) Induce or encourage any Client to cease or reduce patronage of Campus Barbers;</p>
            <p className="mb-1 ml-6">(c) Accept or perform services for any Client whom the Contractor first met or became aware of through Campus Barbers, within the Restricted Area; or</p>
            <p className="mb-3 ml-6">(d) Use any Confidential Information to identify, locate, or communicate with any Client or Prospective Client.</p>
            <p className="mb-3"><strong>4.2 Non-Solicitation of Contractors.</strong> During the Restricted Period, the Contractor shall not solicit, recruit, induce, or encourage any other contractor, employee, or service provider of the Company to terminate their relationship with the Company.</p>
            <p className="mb-3"><strong>4.3 Social Media and Online Conduct.</strong> The Contractor shall not, during the Restricted Period: (a) post content targeting Clients; (b) use client lists or contact info from Company social media; or (c) disparage or make false statements about the Company online or otherwise.</p>
            <p className="mb-3"><strong>4.4 Pre-Existing Clients.</strong> Nothing in this Agreement prohibits the Contractor from serving individuals who were bona fide personal clients before the Contractor&apos;s association with Campus Barbers, provided the Contractor can demonstrate such pre-existing relationship through documented evidence predating the Chair Rental Agreement.</p>
            <h3 className="font-bold mb-3 mt-6">ARTICLE 5 — LIMITED NON-COMPETITION</h3>
            <p className="mb-3"><strong>5.1 Reasonableness.</strong> The Contractor acknowledges that the restrictions are reasonable and necessary to protect the Company&apos;s legitimate business interests. The Contractor may practice barbering outside the Restricted Area without limitation.</p>
            <p className="mb-3"><strong>5.2 Restricted Activities.</strong> During the Restricted Period and within the Restricted Area, the Contractor shall not establish, operate, own, manage, or be associated with any competing barbershop, salon, or grooming establishment, if such activity involves the solicitation or servicing of Clients as defined herein.</p>
            <h3 className="font-bold mb-3 mt-6">ARTICLE 6 — TRADE SECRET ACKNOWLEDGMENT</h3>
            <p className="mb-3"><strong>6.1 Trade Secret Status.</strong> The Contractor acknowledges that the Client Database constitutes trade secrets under the Michigan Uniform Trade Secrets Act, MCL 445.1901 et seq., and that the Company has taken reasonable measures to maintain secrecy.</p>
            <p className="mb-3"><strong>6.2 Misappropriation.</strong> Any unauthorized acquisition, disclosure, or use of trade secrets shall entitle the Company to all remedies under the Michigan Uniform Trade Secrets Act, including injunctive relief, actual damages, unjust enrichment, and attorney&apos;s fees.</p>
            <h3 className="font-bold mb-3 mt-6">ARTICLE 7 — REMEDIES AND ENFORCEMENT</h3>
            <p className="mb-3"><strong>7.1 Irreparable Harm.</strong> The Contractor acknowledges that any breach would cause immediate and irreparable harm. The Company shall be entitled to injunctive relief and specific performance without posting a bond or proving actual damages.</p>
            <p className="mb-3"><strong>7.2 Liquidated Damages.</strong> The Contractor agrees to pay $5,000.00 per Client solicited in violation of Article 4, plus $10,000.00 per instance of unauthorized data copying or misappropriation in violation of Article 3. These amounts are a reasonable estimate of damages, not a penalty.</p>
            <p className="mb-3"><strong>7.3 Tolling.</strong> If the Contractor violates Articles 4 or 5, the Restricted Period shall be tolled during the violation period.</p>
            <p className="mb-3"><strong>7.4 Attorney&apos;s Fees.</strong> The prevailing Party shall recover reasonable attorney&apos;s fees, costs, and expenses.</p>
            <p className="mb-3"><strong>7.5 Cumulative Remedies.</strong> All rights and remedies under this Agreement are cumulative and in addition to any other available remedies.</p>
            <h3 className="font-bold mb-3 mt-6">ARTICLE 8 — GENERAL PROVISIONS</h3>
            <p className="mb-3"><strong>8.1 Governing Law and Venue.</strong> Governed by Michigan law. Venue exclusively in Ingham County Circuit Court or the U.S. District Court for the Western District of Michigan.</p>
            <p className="mb-3"><strong>8.2 Severability.</strong> If any provision is found unenforceable, it shall be modified to the minimum extent necessary. Remaining provisions continue in full force.</p>
            <p className="mb-3"><strong>8.3 Entire Agreement.</strong> This Agreement and the Chair Rental Agreement constitute the entire agreement between the Parties on this subject matter.</p>
            <p className="mb-3"><strong>8.4 Amendments.</strong> May not be amended except in writing signed by both Parties.</p>
            <p className="mb-3"><strong>8.5 Waiver.</strong> No waiver is effective unless in writing. No failure to exercise a right constitutes a waiver.</p>
            <p className="mb-3"><strong>8.6 Assignment.</strong> Contractor may not assign without written consent. Company may assign to any successor.</p>
            <p className="mb-3"><strong>8.7 Independent Contractor Status.</strong> Nothing herein creates an employer-employee relationship.</p>
            <p className="mb-3"><strong>8.8 Survival.</strong> Articles 2, 4, 5, 6, and 7 survive termination.</p>
            <p className="mb-3"><strong>8.9 Counterparts.</strong> May be executed in counterparts. Electronic signatures have the same force as originals.</p>
            <p className="mb-6"><strong>8.10 Notice.</strong> All notices shall be in writing, delivered personally, by certified mail, or by email with confirmed receipt.</p>
            <h3 className="font-bold text-center mb-4 mt-6">ACKNOWLEDGMENT</h3>
            <p className="mb-3">By signing below electronically, the Contractor acknowledges and agrees that:</p>
            <p className="mb-1 ml-6">(a) The Contractor has read and understands this Agreement in its entirety;</p>
            <p className="mb-1 ml-6">(b) The Contractor has had a reasonable opportunity to consult with independent legal counsel;</p>
            <p className="mb-1 ml-6">(c) The Contractor is signing voluntarily and without coercion;</p>
            <p className="mb-1 ml-6">(d) The restrictions are reasonable in scope, duration, and geographic extent;</p>
            <p className="mb-1 ml-6">(e) Access to the Staff Portal constitutes adequate consideration; and</p>
            <p className="mb-4 ml-6">(f) A breach will cause irreparable and ongoing harm to the Company.</p>
            <div className="border-t-2 border-charcoal/20 pt-4 mt-6">
              <p className="font-bold text-center text-base">END OF AGREEMENT</p>
              <p className="text-center text-xs text-charcoal/50 mt-2">Agreement Version 2025-02-09-v1</p>
            </div>
          </div>
          {!scrolledToBottom && (
            <div className="text-center py-2 text-sm text-charcoal/50 animate-pulse">
              ↓ Scroll to bottom to continue ↓
            </div>
          )}
          <div className={`mt-6 transition-opacity duration-300 ${scrolledToBottom ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <div className="border-2 border-spartan-500/20 p-6 bg-white">
              <h3 className="font-display font-bold text-spartan-500 text-lg mb-4">Electronic Signature</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Your Full Legal Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="First and Last Name" className="input-field" disabled={!scrolledToBottom} />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-charcoal/60 mb-1">Email (from your login)</label>
                <p className="text-charcoal font-medium">{userEmail}</p>
              </div>
              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-1 h-4 w-4 border-2 border-spartan-500/40 accent-spartan-500" disabled={!scrolledToBottom} />
                <span className="text-sm text-charcoal">I have read this Agreement in its entirety, I understand its terms, and I voluntarily agree to be bound by it. I understand that this is a legally binding agreement and that I have the right to consult an attorney before signing. By typing my name and checking this box, I am executing this Agreement with the same legal force as a handwritten signature.</span>
              </label>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 text-sm">{error}</div>
              )}
              <button onClick={handleAccept} disabled={submitting || !scrolledToBottom || !acknowledged || !fullName.trim()} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {submitting ? 'Processing...' : 'I Accept — Grant Me Portal Access'}
              </button>
              <p className="text-xs text-charcoal/40 mt-3 text-center">If you do not agree to these terms, you will not be granted access to the Staff Portal. Close this page to decline.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
