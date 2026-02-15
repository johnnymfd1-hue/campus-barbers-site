import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock next/headers before importing security module
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map()),
}))

import {
  generateFingerprint,
  isHoneypotTriggered,
  normalizePhone,
  normalizeEmail,
  checkRateLimit,
} from '@/lib/security'

// ===========================
// normalizePhone
// ===========================
describe('normalizePhone', () => {
  it('strips non-digits and returns last 10 digits', () => {
    expect(normalizePhone('(517) 332-5353')).toBe('5173325353')
  })

  it('handles phone with country code prefix', () => {
    expect(normalizePhone('+1-517-332-5353')).toBe('5173325353')
  })

  it('handles already-clean 10-digit number', () => {
    expect(normalizePhone('5173325353')).toBe('5173325353')
  })

  it('handles number with dots', () => {
    expect(normalizePhone('517.332.5353')).toBe('5173325353')
  })

  it('handles number with spaces', () => {
    expect(normalizePhone('517 332 5353')).toBe('5173325353')
  })

  it('returns empty string for empty input', () => {
    expect(normalizePhone('')).toBe('')
  })

  it('handles short numbers by returning what it has', () => {
    expect(normalizePhone('5551234')).toBe('5551234')
  })

  it('handles 11-digit number with leading 1', () => {
    expect(normalizePhone('15173325353')).toBe('5173325353')
  })
})

// ===========================
// normalizeEmail
// ===========================
describe('normalizeEmail', () => {
  it('lowercases and trims email', () => {
    expect(normalizeEmail('  John@Gmail.COM  ')).toBe('john@gmail.com')
  })

  it('handles already-normalized email', () => {
    expect(normalizeEmail('user@example.com')).toBe('user@example.com')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeEmail('')).toBe('')
  })

  it('handles email with mixed case', () => {
    expect(normalizeEmail('JoHn.DoE@Example.COM')).toBe('john.doe@example.com')
  })

  it('trims leading whitespace', () => {
    expect(normalizeEmail('   test@test.com')).toBe('test@test.com')
  })

  it('trims trailing whitespace', () => {
    expect(normalizeEmail('test@test.com   ')).toBe('test@test.com')
  })
})

// ===========================
// generateFingerprint
// ===========================
describe('generateFingerprint', () => {
  const baseData = {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Test',
    acceptLanguage: 'en-US',
    screenResolution: '1920x1080',
    timezone: 'America/Detroit',
  }

  it('returns a string', () => {
    const result = generateFingerprint(baseData)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns the same hash for the same input', () => {
    const hash1 = generateFingerprint(baseData)
    const hash2 = generateFingerprint(baseData)
    expect(hash1).toBe(hash2)
  })

  it('returns different hashes for different user agents', () => {
    const hash1 = generateFingerprint(baseData)
    const hash2 = generateFingerprint({ ...baseData, userAgent: 'Chrome/100' })
    expect(hash1).not.toBe(hash2)
  })

  it('returns different hashes for different screen resolutions', () => {
    const hash1 = generateFingerprint(baseData)
    const hash2 = generateFingerprint({ ...baseData, screenResolution: '3840x2160' })
    expect(hash1).not.toBe(hash2)
  })

  it('handles missing optional fields', () => {
    const result = generateFingerprint({
      ip: '10.0.0.1',
      userAgent: 'Test Agent',
    })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('does not use IP in hash computation (by design)', () => {
    const hash1 = generateFingerprint(baseData)
    const hash2 = generateFingerprint({ ...baseData, ip: '10.0.0.1' })
    // IP is not part of the hash string, so these should be equal
    expect(hash1).toBe(hash2)
  })

  it('returns a base-36 encoded string', () => {
    const result = generateFingerprint(baseData)
    // base-36 uses characters 0-9 and a-z
    expect(result).toMatch(/^[0-9a-z]+$/)
  })
})

// ===========================
// isHoneypotTriggered
// ===========================
describe('isHoneypotTriggered', () => {
  it('returns triggered:false when all honeypot fields are empty (plain object)', () => {
    const result = isHoneypotTriggered({
      website: '',
      url: '',
      company: '',
      fax: '',
      hp_field: '',
      address2: '',
    })
    expect(result.triggered).toBe(false)
  })

  it('returns triggered:true when website field is filled', () => {
    const result = isHoneypotTriggered({ website: 'http://spam.com' })
    expect(result.triggered).toBe(true)
    expect(result.value).toBe('http://spam.com')
  })

  it('returns triggered:true when company field is filled', () => {
    const result = isHoneypotTriggered({ company: 'SpamCorp' })
    expect(result.triggered).toBe(true)
    expect(result.value).toBe('SpamCorp')
  })

  it('returns triggered:true when fax field is filled', () => {
    const result = isHoneypotTriggered({ fax: '555-1234' })
    expect(result.triggered).toBe(true)
    expect(result.value).toBe('555-1234')
  })

  it('returns triggered:true when url field is filled', () => {
    const result = isHoneypotTriggered({ url: 'http://bot.net' })
    expect(result.triggered).toBe(true)
    expect(result.value).toBe('http://bot.net')
  })

  it('returns triggered:true when hp_field is filled', () => {
    const result = isHoneypotTriggered({ hp_field: 'gotcha' })
    expect(result.triggered).toBe(true)
    expect(result.value).toBe('gotcha')
  })

  it('returns triggered:true when address2 is filled', () => {
    const result = isHoneypotTriggered({ address2: '123 Fake St' })
    expect(result.triggered).toBe(true)
  })

  it('ignores non-honeypot fields', () => {
    const result = isHoneypotTriggered({
      name: 'John Doe',
      phone: '5173325353',
      email: 'john@test.com',
    })
    expect(result.triggered).toBe(false)
  })

  it('treats whitespace-only values as empty', () => {
    const result = isHoneypotTriggered({ website: '   ', company: '  ' })
    expect(result.triggered).toBe(false)
  })

  it('returns the first triggered field value', () => {
    const result = isHoneypotTriggered({
      website: 'first',
      company: 'second',
    })
    expect(result.triggered).toBe(true)
    expect(result.value).toBe('first')
  })
})

// ===========================
// checkRateLimit
// ===========================
describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset the rate limit map between tests by calling with unique IPs
    // or by manipulating time
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first request from an IP', () => {
    expect(checkRateLimit('test-ip-1')).toBe(true)
  })

  it('allows requests within the limit', () => {
    const ip = 'test-ip-2'
    expect(checkRateLimit(ip, 3)).toBe(true)
    expect(checkRateLimit(ip, 3)).toBe(true)
    expect(checkRateLimit(ip, 3)).toBe(true)
  })

  it('blocks requests exceeding the limit', () => {
    const ip = 'test-ip-3'
    // Use limit of 2
    expect(checkRateLimit(ip, 2)).toBe(true) // count=1
    expect(checkRateLimit(ip, 2)).toBe(true) // count=2
    expect(checkRateLimit(ip, 2)).toBe(false) // count=2 >= maxRequests=2
  })

  it('resets after the time window expires', () => {
    const ip = 'test-ip-4'
    const windowMs = 1000

    expect(checkRateLimit(ip, 1, windowMs)).toBe(true)
    expect(checkRateLimit(ip, 1, windowMs)).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1)

    expect(checkRateLimit(ip, 1, windowMs)).toBe(true)
  })

  it('tracks different IPs independently', () => {
    expect(checkRateLimit('ip-a-1', 1)).toBe(true)
    expect(checkRateLimit('ip-b-1', 1)).toBe(true)
    // ip-a is now at limit
    expect(checkRateLimit('ip-a-1', 1)).toBe(false)
    // ip-b is also at limit
    expect(checkRateLimit('ip-b-1', 1)).toBe(false)
  })

  it('uses default maxRequests of 10 when not specified', () => {
    const ip = 'test-ip-5'
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(ip)).toBe(true)
    }
    expect(checkRateLimit(ip)).toBe(false)
  })
})
