'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BookingForm from '@/components/BookingForm'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function HomePage() {
  const [showBooking, setShowBooking] = useState(false)
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null)

  const services = [
    { name: 'Regular Haircut', price: 30, duration: '30 min', description: 'Classic precision cut with hot towel finish' },
    { name: 'Senior Cut', price: 25, duration: '30 min', description: 'For our distinguished gentlemen 65+' },
    { name: 'Kids Cut', price: 25, duration: '25 min', description: 'Ages 12 and under' },
    { name: 'Beard Trim', price: 15, duration: '15 min', description: 'Shape up and line work' },
    { name: 'Haircut + Beard', price: 40, duration: '45 min', description: 'The full service combo' },
  ]

  const barbers = [
    {
      id: 'john',
      name: 'John',
      image: '/john.jpg',
      bio: 'Owner. Barber since 2008. I come from a family of barbers and good people.',
      hours: '9 AM - 6 PM',
    },
    {
      id: 'nicholas',
      name: 'Nicholas',
      image: '/jason.jpg',
      bio: 'Bringing precision and style to every cut.',
      hours: '9 AM - 5 PM',
    },
    {
      id: 'jason-schlee',
      name: 'Jason Schlee',
      image: '/nic.jpg',
      bio: 'Started cutting hair at the age of 12 as a hobby. After retiring from the Army in 2016 I went to barber school to turn my hobby into a passion. I\'m very particular and pay attention to every detail on every cut I do.',
      hours: '9 AM - 5 PM',
    },
  ]

  const openBooking = (barberId?: string) => {
    setSelectedBarber(barberId || null)
    setShowBooking(true)
    document.body.style.overflow = 'hidden'
  }

  const closeBooking = () => {
    setShowBooking(false)
    setSelectedBarber(null)
    document.body.style.overflow = 'auto'
  }

  return (
    <main className="min-h-screen bg-noir-500">
      <Navigation onBookClick={() => openBooking()} />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-noir-500">
        {/* Crimson accent stripes */}
        <div className="absolute left-0 top-0 h-full w-[2px] accent-stripe" />
        <div className="absolute right-0 top-0 h-full w-[2px] accent-stripe" />

        {/* Ambient crimson glow */}
        <div className="absolute inset-0 crimson-glow" />

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-noir-500 via-transparent to-noir-500 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-noir-500 via-transparent to-noir-500 opacity-40" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-crimson-light font-display text-lg tracking-[0.4em] uppercase mb-4"
          >
            Established 1952
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-display text-ivory text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-2"
          >
            Campus
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="font-display text-crimson text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 drop-shadow-[0_0_30px_rgba(139,26,43,0.4)]"
          >
            Barbers
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="divider-glow w-48 mx-auto mb-8"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-ivory/60 text-xl md:text-2xl font-light max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The original barbershop serving Michigan State University and East Lansing for over 70 years.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => openBooking()}
              className="bg-crimson text-ivory px-10 py-4 text-lg font-semibold tracking-widest uppercase hover:bg-crimson-light transition-all duration-300 hover:shadow-glow"
            >
              Book Appointment
            </button>
            <a
              href="#services"
              className="border border-rose-gold/40 text-rose-gold px-10 py-4 text-lg font-semibold tracking-widest uppercase hover:bg-rose-gold/10 transition-all duration-300"
            >
              View Services
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-10 text-crimson/50" fill="none" viewBox="0 0 24 40">
            <rect x="1" y="1" width="22" height="38" rx="11" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative py-24 px-6 bg-noir-500">
        <div className="absolute inset-0 gold-glow" />
        <div className="divider-glow mb-24" />

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-crimson font-display text-sm tracking-[0.4em] uppercase mb-3">What We Offer</p>
            <h2 className="font-display text-ivory text-5xl md:text-6xl font-bold">Services</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-noir-200/50 p-8 border border-crimson/10 hover:border-crimson/30 transition-all duration-500 group card-glow backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-display text-2xl font-semibold text-ivory">{service.name}</h3>
                  <span className="text-rose-gold font-display text-3xl font-bold">${service.price}</span>
                </div>
                <p className="text-ivory/40 mb-4">{service.description}</p>
                <p className="text-sm text-crimson/60 font-medium">{service.duration}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => openBooking()}
              className="btn-primary text-lg tracking-widest uppercase"
            >
              Book Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="relative py-24 px-6 bg-velvet">
        <div className="absolute inset-0 crimson-glow opacity-50" />
        <div className="divider-glow mb-24" />

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-rose-gold font-display text-sm tracking-[0.4em] uppercase mb-3">The Team</p>
            <h2 className="font-display text-ivory text-5xl md:text-6xl font-bold">Meet Your Barbers</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {barbers.map((barber, index) => (
              <motion.div
                key={barber.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-noir-500/80 p-8 border border-crimson/15 hover:border-crimson/40 transition-all duration-500 backdrop-blur-sm group"
              >
                {/* Barber photo */}
                <div className="relative w-28 h-28 mb-6">
                  <div className="absolute inset-0 rounded-full bg-crimson/20 blur-xl group-hover:bg-crimson/30 transition-all duration-500" />
                  <img
                    src={barber.image}
                    alt={barber.name}
                    className="relative w-28 h-28 rounded-full object-cover border-2 border-crimson/40 group-hover:border-rose-gold transition-all duration-500"
                  />
                </div>

                <h3 className="font-display text-3xl font-semibold text-ivory mb-2">{barber.name}</h3>
                <p className="text-rose-gold text-sm font-medium mb-4 tracking-wider">{barber.hours} EST</p>
                <p className="text-ivory/50 leading-relaxed mb-6">{barber.bio}</p>

                <button
                  onClick={() => openBooking(barber.id)}
                  className="bg-crimson text-ivory px-6 py-3 font-semibold tracking-widest uppercase hover:bg-crimson-light transition-all duration-300 w-full hover:shadow-glow"
                >
                  Book with {barber.name.split(' ')[0]}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="relative py-24 px-6 bg-noir-500">
        <div className="divider-glow mb-24" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-crimson font-display text-sm tracking-[0.4em] uppercase mb-3">Visit Us</p>
              <h2 className="font-display text-ivory text-5xl font-bold mb-8">Location</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-xl font-semibold text-rose-gold mb-2">Address</h3>
                  <p className="text-ivory/50">
                    621 E Grand River Ave<br />
                    East Lansing, MI 48823
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold text-rose-gold mb-2">Hours</h3>
                  <p className="text-ivory/50">
                    Monday - Tuesday: 9 AM - 5 PM<br />
                    Wednesday - Friday: 9 AM - 6 PM<br />
                    Saturday - Sunday: Closed
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold text-rose-gold mb-2">Contact</h3>
                  <p className="text-ivory/50">
                    <a href="tel:+15173379881" className="hover:text-rose-gold transition-colors duration-300">
                      (517) 337-9881
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-velvet border border-crimson/15 aspect-video flex items-center justify-center"
            >
              <div className="text-ivory/30 text-center p-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-crimson/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="font-display text-ivory/50">621 E Grand River Ave</p>
                <p className="text-sm text-ivory/30">East Lansing, MI 48823</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 bg-crimson overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-crimson-dark via-crimson to-crimson-dark" />
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="cta-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-ivory"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-ivory text-4xl md:text-5xl font-bold mb-6"
          >
            Ready for a Fresh Cut?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-ivory/70 text-xl mb-8"
          >
            Book your appointment online in seconds.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={() => openBooking()}
            className="bg-noir-500 text-ivory px-12 py-4 text-lg font-semibold tracking-widest uppercase hover:bg-noir-400 transition-all duration-300 hover:shadow-xl border border-ivory/10"
          >
            Book Appointment
          </motion.button>
        </div>
      </section>

      <Footer />

      {/* Booking Modal */}
      <AnimatePresence>
        {showBooking && (
          <BookingForm
            onClose={closeBooking}
            preselectedBarber={selectedBarber}
            services={services}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
