import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ===========================
// Mock dependencies
// ===========================

// Mock next/headers
const mockHeadersMap = new Map<string, string>()
vi.mock('next/headers', () => ({
  headers: vi.fn(() => mockHeadersMap),
}))

// Firestore mock helpers
const mockCollectionFn = vi.fn()

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (...args: any[]) => mockCollectionFn(...args),
  },
}))

// ===========================
// Helpers
// ===========================
function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBooking = {
  name: 'John Doe',
  phone: '(517) 332-5353',
  email: 'john@example.com',
  service: 'Classic Haircut',
  barber: 'john',
  date: '2025-03-01',
  time: '10:00',
  notes: '',
  timeOnPage: 15000,
}

function makeQueryResult(empty: boolean, docs: any[] = []) {
  return { empty, docs }
}

function setupDefaultMocks() {
  mockHeadersMap.clear()
  mockHeadersMap.set('x-forwarded-for', `test-${Math.random()}`)
  mockHeadersMap.set('user-agent', 'TestAgent/1.0')

  const mockAdd = vi.fn().mockResolvedValue({ id: 'new-id-123' })
  const mockDocSet = vi.fn().mockResolvedValue(undefined)
  const mockDocUpdate = vi.fn().mockResolvedValue(undefined)

  mockCollectionFn.mockImplementation(() => ({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(makeQueryResult(true)),
      }),
    }),
    add: mockAdd,
    doc: vi.fn().mockReturnValue({
      set: mockDocSet,
      update: mockDocUpdate,
    }),
  }))

  return { mockAdd, mockDocSet, mockDocUpdate }
}

function setupDNBPhoneMatch() {
  // Use a unique IP to avoid rate limiting
  mockHeadersMap.set('x-forwarded-for', `dnb-phone-${Math.random()}`)

  const mockAdd = vi.fn().mockResolvedValue({ id: 'new-id' })
  const mockDocSet = vi.fn().mockResolvedValue(undefined)
  const mockDocUpdate = vi.fn().mockResolvedValue(undefined)

  mockCollectionFn.mockImplementation((name: string) => {
    if (name === 'doNotBook') {
      return {
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(makeQueryResult(false, [
              { id: 'dnb-1', data: () => ({ name: 'Blocked' }) },
            ])),
          }),
        }),
        add: mockAdd,
        doc: vi.fn().mockReturnValue({ set: mockDocSet, update: mockDocUpdate }),
      }
    }
    return {
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(makeQueryResult(true)),
        }),
      }),
      add: mockAdd,
      doc: vi.fn().mockReturnValue({ set: mockDocSet, update: mockDocUpdate }),
    }
  })
}

function setupDNBEmailMatch() {
  mockHeadersMap.set('x-forwarded-for', `dnb-email-${Math.random()}`)

  const mockAdd = vi.fn().mockResolvedValue({ id: 'new-id' })
  const mockDocSet = vi.fn().mockResolvedValue(undefined)
  const mockDocUpdate = vi.fn().mockResolvedValue(undefined)

  mockCollectionFn.mockImplementation((name: string) => {
    if (name === 'doNotBook') {
      return {
        where: vi.fn().mockImplementation((field: string) => ({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              if (field === 'normalizedPhone') {
                return Promise.resolve(makeQueryResult(true))
              }
              // email match
              return Promise.resolve(makeQueryResult(false, [
                { id: 'dnb-2', data: () => ({ email: 'blocked@test.com' }) },
              ]))
            }),
          }),
        })),
        add: mockAdd,
        doc: vi.fn().mockReturnValue({ set: mockDocSet, update: mockDocUpdate }),
      }
    }
    return {
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(makeQueryResult(true)),
        }),
      }),
      add: mockAdd,
      doc: vi.fn().mockReturnValue({ set: mockDocSet, update: mockDocUpdate }),
    }
  })
}

function setupExistingClient() {
  mockHeadersMap.set('x-forwarded-for', `existing-${Math.random()}`)

  const mockClientUpdate = vi.fn().mockResolvedValue(undefined)
  const mockAdd = vi.fn().mockResolvedValue({ id: 'appt-id' })

  mockCollectionFn.mockImplementation((name: string) => {
    if (name === 'clients') {
      return {
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(makeQueryResult(false, [{
              id: 'existing-client',
              data: () => ({ bookings: 5, email: 'old@test.com' }),
            }])),
          }),
        }),
        add: mockAdd,
        doc: vi.fn().mockReturnValue({
          set: vi.fn().mockResolvedValue(undefined),
          update: mockClientUpdate,
        }),
      }
    }
    return {
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(makeQueryResult(true)),
        }),
      }),
      add: mockAdd,
      doc: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
      }),
    }
  })

  return { mockClientUpdate }
}

// ===========================
// Import after mocks are set up
// ===========================
let POST: typeof import('@/app/api/book/route').POST

beforeEach(async () => {
  vi.clearAllMocks()
  // Dynamic import to ensure mocks are applied
  const mod = await import('@/app/api/book/route')
  POST = mod.POST
})

// ===========================
// Tests
// ===========================
describe('POST /api/book', () => {
  // ------- HONEYPOT -------
  describe('honeypot detection', () => {
    it('returns fake success when website honeypot is triggered', async () => {
      setupDefaultMocks()
      const req = createRequest({ ...validBooking, _hp_website: 'http://spam.com' })
      const response = await POST(req)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.bookingId).toMatch(/^fake-/)
    })

    it('returns fake success when company honeypot is triggered', async () => {
      setupDefaultMocks()
      const req = createRequest({ ...validBooking, _hp_company: 'SpamCorp' })
      const response = await POST(req)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.bookingId).toMatch(/^fake-/)
    })

    it('returns fake success when fax honeypot is triggered', async () => {
      setupDefaultMocks()
      const req = createRequest({ ...validBooking, _hp_fax: '555-1234' })
      const response = await POST(req)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.bookingId).toMatch(/^fake-/)
    })
  })

  // ------- TIME ON PAGE -------
  describe('time-on-page check', () => {
    it('returns fake success for submissions under 3 seconds', async () => {
      setupDefaultMocks()
      const req = createRequest({ ...validBooking, timeOnPage: 1500 })
      const response = await POST(req)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.bookingId).toMatch(/^fake-/)
    })

    it('allows submissions at exactly 3 seconds', async () => {
      setupDefaultMocks()
      const req = createRequest({ ...validBooking, timeOnPage: 3000 })
      const response = await POST(req)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.bookingId).not.toMatch(/^fake-/)
    })
  })

  // ------- DNB CHECK -------
  describe('Do Not Book list', () => {
    it('returns fake success when phone matches DNB list', async () => {
      setupDNBPhoneMatch()
      const req = createRequest(validBooking)
      const response = await POST(req)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.bookingId).toMatch(/^fake-/)
    })

    it('returns fake success when email matches DNB list', async () => {
      setupDNBEmailMatch()
      const req = createRequest(validBooking)
      const response = await POST(req)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.bookingId).toMatch(/^fake-/)
    })
  })

  // ------- SUCCESSFUL BOOKING -------
  describe('successful booking', () => {
    it('creates appointment and returns real booking ID for valid request', async () => {
      setupDefaultMocks()
      const req = createRequest(validBooking)
      const response = await POST(req)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.bookingId).not.toMatch(/^fake-/)
    })

    it('updates existing client instead of creating duplicate', async () => {
      const { mockClientUpdate } = setupExistingClient()
      const req = createRequest(validBooking)
      const response = await POST(req)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(mockClientUpdate).toHaveBeenCalled()
    })
  })

  // ------- ERROR HANDLING -------
  describe('error handling', () => {
    it('returns 500 with generic error on unexpected failure', async () => {
      mockHeadersMap.set('x-forwarded-for', `error-${Math.random()}`)
      mockCollectionFn.mockImplementation(() => {
        throw new Error('Firestore connection failed')
      })

      const req = createRequest(validBooking)
      const response = await POST(req)
      const data = await response.json()
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Booking failed')
      expect(data.error).not.toContain('Firestore')
    })

    it('returns 500 for malformed JSON', async () => {
      setupDefaultMocks()
      const req = new NextRequest('http://localhost:3000/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-valid-json{{{',
      })
      const response = await POST(req)
      const data = await response.json()
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  // ------- FINGERPRINT STORAGE -------
  describe('fingerprint handling', () => {
    it('stores fingerprint when provided', async () => {
      const { mockDocSet } = setupDefaultMocks()
      const req = createRequest({
        ...validBooking,
        fingerprint: {
          screenResolution: '1920x1080',
          timezone: 'America/Detroit',
          language: 'en-US',
          platform: 'MacIntel',
          cookiesEnabled: true,
          doNotTrack: null,
        },
      })
      const response = await POST(req)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(mockDocSet).toHaveBeenCalled()
    })
  })
})
