'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Footer from '@/components/Footer'

const jobOpenings = [
  {
    title: 'Licensed Barber',
    type: 'Full-Time',
    pay: '$30 - $45/hr + tips',
    description:
      'We\'re looking for skilled, licensed barbers who take pride in every cut. You\'ll work alongside a tight-knit team in a shop that\'s been a campus staple since 1952.',
    requirements: [
      'Valid Michigan barber license',
      'Minimum 1 year of professional experience',
      'Proficient in fades, tapers, and classic cuts',
      'Strong attention to detail',
      'Reliable and punctual',
    ],
  },
  {
    title: 'Licensed Hairstylist',
    type: 'Full-Time / Part-Time',
    pay: '$28 - $42/hr + tips',
    description:
      'Bring your creativity and skill to Campus Barbers. We\'re expanding our services and looking for talented hairstylists to join the team.',
    requirements: [
      'Valid Michigan cosmetology or barber license',
      'Experience with men\'s and women\'s cuts',
      'Knowledge of current styles and trends',
      'Excellent client communication skills',
      'Team player with a positive attitude',
    ],
  },
]

const perks = [
  { title: 'Walk-In Friendly', detail: 'Steady walk-in traffic from MSU campus' },
  { title: 'Flexible Scheduling', detail: 'Build a schedule that works for you' },
  { title: 'Commission + Tips', detail: 'Competitive pay with strong tip culture' },
  { title: 'Legacy Shop', detail: 'Be part of a 70+ year East Lansing institution' },
  { title: 'Growth Opportunity', detail: 'Grow your client base from day one' },
  { title: 'Supportive Team', detail: 'Family atmosphere with experienced barbers' },
]

export default function CareersPage() {
  return (
    <main className="min-h-screen">
      {/* Simple Nav */}
      <nav className="bg-spartan-500 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Campus Barbers" className="w-10 h-10 rounded-full" />
            <span className="font-display text-cream text-xl font-semibold hidden sm:block">
              Campus Barbers
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-cream/80 hover:text-cream font-medium transition-colors duration-200"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 md:py-32 bg-spartan-500 overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-3 barber-pole" />
        <div className="absolute right-0 top-0 h-full w-3 barber-pole" />

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-gold font-display text-lg tracking-[0.3em] uppercase mb-4"
          >
            Now Hiring
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-cream text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Join the
            <span className="block text-gold">Campus Barbers Team</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-cream/80 text-xl md:text-2xl font-light max-w-2xl mx-auto"
          >
            We&apos;re growing and looking for talented barbers and hairstylists to join our
            legendary shop in East Lansing.
          </motion.p>
        </div>
      </section>

      {/* Why Campus Barbers */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-3">
              Why Work Here
            </p>
            <h2 className="font-display text-spartan-500 text-4xl md:text-5xl font-bold">
              Built Different Since 1952
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk, index) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 border-2 border-spartan-500/10 hover:border-spartan-500/30 transition-all duration-300"
              >
                <h3 className="font-display text-xl font-semibold text-spartan-500 mb-2">
                  {perk.title}
                </h3>
                <p className="text-charcoal/60">{perk.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 px-6 bg-spartan-500">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-3">
              Open Positions
            </p>
            <h2 className="font-display text-cream text-4xl md:text-5xl font-bold">
              We&apos;re Hiring
            </h2>
          </motion.div>

          <div className="space-y-8">
            {jobOpenings.map((job, index) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-spartan-600/50 p-8 md:p-10 border border-cream/10"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <h3 className="font-display text-3xl font-semibold text-cream">{job.title}</h3>
                  <div className="flex gap-3">
                    <span className="bg-gold/20 text-gold px-3 py-1 text-sm font-medium">
                      {job.type}
                    </span>
                    <span className="bg-cream/10 text-cream/80 px-3 py-1 text-sm font-medium">
                      {job.pay}
                    </span>
                  </div>
                </div>

                <p className="text-cream/70 leading-relaxed mb-6">{job.description}</p>

                <div className="mb-6">
                  <h4 className="text-gold text-sm font-semibold tracking-wide uppercase mb-3">
                    Requirements
                  </h4>
                  <ul className="space-y-2">
                    {job.requirements.map((req) => (
                      <li key={req} className="text-cream/60 flex items-start gap-2">
                        <span className="text-gold mt-1 flex-shrink-0">&#10003;</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="mailto:johnnymfd1@campusbarbersinc.com?subject=Application: {{title}}"
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = `mailto:johnnymfd1@campusbarbersinc.com?subject=Application: ${job.title}&body=Hi, I'm interested in the ${job.title} position at Campus Barbers. Here's a bit about my experience:%0D%0A%0D%0A`
                  }}
                  className="inline-block bg-gold text-charcoal px-8 py-3 font-semibold tracking-wide hover:bg-gold-light transition-all duration-300"
                >
                  Apply Now
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ZipRecruiter Widget Section */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-3">
              More Opportunities
            </p>
            <h2 className="font-display text-spartan-500 text-4xl md:text-5xl font-bold mb-6">
              View All Openings
            </h2>
            <p className="text-charcoal/60 text-lg mb-8 max-w-2xl mx-auto">
              Check out all of our current openings on ZipRecruiter and apply directly.
            </p>

            {/*
              ============================================================
              ZIPRECRUITER JOB WIDGET
              ============================================================
              To embed your ZipRecruiter job listings here:
              1. Log in to your ZipRecruiter employer account
              2. Go to Account > Career Page Widget
              3. Copy the HTML/JS snippet ZipRecruiter provides
              4. Replace the placeholder div below with your snippet

              Your widget code will look something like:
              <div id="zr-widget" data-company="campus-barbers"></div>
              <script src="https://www.ziprecruiter.com/jobs-widget/..."></script>
              ============================================================
            */}
            <div
              id="ziprecruiter-widget"
              className="bg-white border-2 border-dashed border-spartan-500/20 p-12 mb-8"
            >
              <p className="text-charcoal/40 text-sm">
                ZipRecruiter job listings will appear here once connected.
              </p>
            </div>

            <a
              href="https://www.ziprecruiter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-spartan-500 text-cream px-10 py-4 text-lg font-semibold tracking-wide hover:bg-spartan-600 transition-all duration-300"
            >
              View on ZipRecruiter
            </a>
          </motion.div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section className="py-20 px-6 bg-gold">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-charcoal text-4xl md:text-5xl font-bold mb-6"
          >
            Ready to Join the Team?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-charcoal/70 text-xl mb-4"
          >
            Stop by the shop or send us your info. We&apos;d love to meet you.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-2 text-charcoal/80 text-lg mb-8"
          >
            <p>621 E Grand River Ave, East Lansing, MI 48823</p>
            <p>
              <a href="tel:+15173379881" className="hover:text-charcoal transition-colors font-semibold">
                (517) 337-9881
              </a>
            </p>
            <p>
              <a
                href="mailto:johnnymfd1@campusbarbersinc.com"
                className="hover:text-charcoal transition-colors font-semibold"
              >
                johnnymfd1@campusbarbersinc.com
              </a>
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <a
              href="mailto:johnnymfd1@campusbarbersinc.com?subject=I'd like to join Campus Barbers"
              className="inline-block bg-spartan-500 text-cream px-12 py-4 text-lg font-semibold tracking-wide hover:bg-spartan-600 transition-all duration-300 hover:shadow-xl"
            >
              Email Us
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
