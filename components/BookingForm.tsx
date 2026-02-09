'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Service {
  name: string
  price: number
  duration: string
  description: string
}

interface BookingFormProps {
  onClose: () => void
  preselectedBarber: string | null
  services: Service[]
}

interface ClientFingerprint {
  screenResolution: string
  timezone: string
  language: string
  platform: string
  cookiesEnabled: boolean
  doNotTrack: string | null
}

export default function BookingForm({ onClose, preselectedBarber, services }: BookingFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const loadTime = useRef(Date.now())

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    barber: preselectedBarber || '',
    date: '',
    time: '',
    notes: '',
    // Honeypot fields (invisible to humans)
    website: '',
    company: '',
    fax: '',
  })

  // Fingerprint state
  const [fingerprint, setFingerprint] = useState<ClientFingerprint | null>(null)

  // Generate client fingerprint on mount
  useEffect(() => {
    const fp: ClientFingerprint = {
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
    }
    setFingerprint(fp)

    // Check for returning client via localStorage fingerprint
    const storedFingerprint = localStorage.getItem('cb_client_fp')
    if (storedFingerprint) {
      try {
        const stored = JSON.parse(storedFingerprint)
        if (stored.name) setFormData(prev => ({ ...prev, name: stored.name }))
        if (stored.phone) setFormData(prev => ({ ...prev, phone: stored.phone }))
        if (stored.email) setFormData(prev => ({ ...prev, email: stored.email }))
      } catch (e) {
        // Invalid stored data, ignore
      }
    }
  }, [])

  const barbers = [
    { id: 'john', name: 'John', image: '/john.jpg' },
    { id: 'nicholas', name: 'Nicholas', image: '/nic.jpg' },
    { id: 'jason-schlee', name: 'Jason Schlee', image: '/jason.jpg' },
  ]

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 16 && min === 30) continue // No 4:30 slot
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
        const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        slots.push({ value: time, label: displayTime })
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Get available dates (next 14 days, excluding Sundays)
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      if (date.getDay() !== 0) { // Exclude Sundays
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        })
      }
    }
    return dates
  }

  const availableDates = getAvailableDates()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Calculate time on page (bot detection - too fast is suspicious)
    const timeOnPage = Date.now() - loadTime.current

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fingerprint,
          timeOnPage,
          // Send honeypot fields for server-side validation
          _hp_website: formData.website,
          _hp_company: formData.company,
          _hp_fax: formData.fax,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store fingerprint for frictionless return visits
        localStorage.setItem('cb_client_fp', JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          fp: fingerprint,
        }))
        setSubmitSuccess(true)
      } else {
        // Generic error - never reveal why booking failed (DNB, honeypot, etc.)
        setError('Unable to complete booking. Please call us at (517) 332-5353.')
      }
    } catch (err) {
      setError('Unable to complete booking. Please call us at (517) 332-5353.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.phone)) {
      setError('Please enter your name and phone number.')
      return
    }
    if (step === 2 && (!formData.service || !formData.barber)) {
      setError('Please select a service and barber.')
      return
    }
    if (step === 3 && (!formData.date || !formData.time)) {
      setError('Please select a date and time.')
      return
    }
    setError(null)
    setStep(prev => Math.min(prev + 1, 4))
  }

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-charcoal/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-cream max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 bg-spartan-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-bold text-spartan-500 mb-4">Booking Confirmed!</h2>
          <p className="text-charcoal/70 mb-6">
            We'll see you on {new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {timeSlots.find(t => t.value === formData.time)?.label}.
          </p>
          <p className="text-sm text-charcoal/50 mb-8">
            A confirmation has been sent to your email.
          </p>
          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Done
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-charcoal/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-cream max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-spartan-500 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gold text-sm tracking-wider uppercase">Book Appointment</p>
              <h2 className="font-display text-cream text-2xl font-bold">Step {step} of 4</h2>
            </div>
            <button
              onClick={onClose}
              className="text-cream/70 hover:text-cream transition-colors p-2"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  s <= step ? 'bg-gold' : 'bg-cream/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* HONEYPOT FIELDS - Invisible to humans, bots will fill them */}
          <div className="hp-field" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <div className="hp-field" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <div className="hp-field" aria-hidden="true">
            <label htmlFor="fax">Fax</label>
            <input
              type="text"
              id="fax"
              name="fax"
              value={formData.fax}
              onChange={handleInputChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Contact Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="font-display text-xl font-semibold text-spartan-500">Your Information</h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-charcoal/70 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-charcoal/70 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="(517) 555-0123"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal/70 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="john@example.com"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Service & Barber */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="font-display text-xl font-semibold text-spartan-500">Select Service</h3>
              
              <div className="grid gap-2">
                {services.map((service) => (
                  <label
                    key={service.name}
                    className={`flex items-center justify-between p-4 border-2 cursor-pointer transition-all duration-200 ${
                      formData.service === service.name
                        ? 'border-spartan-500 bg-spartan-500/5'
                        : 'border-spartan-500/20 hover:border-spartan-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="service"
                        value={service.name}
                        checked={formData.service === service.name}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-spartan-500"
                      />
                      <div>
                        <p className="font-medium text-charcoal">{service.name}</p>
                        <p className="text-sm text-charcoal/50">{service.duration}</p>
                      </div>
                    </div>
                    <span className="font-display font-bold text-gold text-xl">${service.price}</span>
                  </label>
                ))}
              </div>

              <h3 className="font-display text-xl font-semibold text-spartan-500 pt-4">Select Barber</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {barbers.map((barber) => (
                  <label
                    key={barber.id}
                    className={`p-4 border-2 cursor-pointer transition-all duration-200 text-center ${
                      formData.barber === barber.id
                        ? 'border-spartan-500 bg-spartan-500/5'
                        : 'border-spartan-500/20 hover:border-spartan-500/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="barber"
                      value={barber.id}
                      checked={formData.barber === barber.id}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="font-display font-bold text-gold text-lg">
                        {barber.name.charAt(0)}
                      </span>
                    </div>
                    <p className="font-medium text-charcoal">{barber.name}</p>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="font-display text-xl font-semibold text-spartan-500">Select Date</h3>
              
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableDates.map((date) => (
                  <label
                    key={date.value}
                    className={`p-3 border-2 cursor-pointer transition-all duration-200 text-center ${
                      formData.date === date.value
                        ? 'border-spartan-500 bg-spartan-500/5'
                        : 'border-spartan-500/20 hover:border-spartan-500/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="date"
                      value={date.value}
                      checked={formData.date === date.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <p className="font-medium text-charcoal text-sm">{date.label}</p>
                  </label>
                ))}
              </div>

              <h3 className="font-display text-xl font-semibold text-spartan-500 pt-4">Select Time</h3>
              
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <label
                    key={slot.value}
                    className={`p-2 border-2 cursor-pointer transition-all duration-200 text-center ${
                      formData.time === slot.value
                        ? 'border-spartan-500 bg-spartan-500/5'
                        : 'border-spartan-500/20 hover:border-spartan-500/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="time"
                      value={slot.value}
                      checked={formData.time === slot.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <p className="font-medium text-charcoal text-sm">{slot.label}</p>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="font-display text-xl font-semibold text-spartan-500">Confirm Booking</h3>
              
              <div className="bg-white border-2 border-spartan-500/10 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Name</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Phone</span>
                  <span className="font-medium">{formData.phone}</span>
                </div>
                {formData.email && (
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">Email</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                )}
                <hr className="border-spartan-500/10" />
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Service</span>
                  <span className="font-medium">{formData.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Barber</span>
                  <span className="font-medium">
                    {barbers.find(b => b.id === formData.barber)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Date</span>
                  <span className="font-medium">
                    {new Date(formData.date).toLocaleDateString('en-US', { 
                      weekday: 'short', month: 'short', day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Time</span>
                  <span className="font-medium">
                    {timeSlots.find(t => t.value === formData.time)?.label}
                  </span>
                </div>
                <hr className="border-spartan-500/10" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-display font-bold text-gold">
                    ${services.find(s => s.name === formData.service)?.price}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-charcoal/70 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Any special requests?"
                />
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary flex-1"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex-1"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 spinner" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
