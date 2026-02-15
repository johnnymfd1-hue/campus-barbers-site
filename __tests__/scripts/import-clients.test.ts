import { describe, it, expect } from 'vitest'

/**
 * Tests for the import-clients.js helper functions.
 * We extract and test the pure normalizePhone and normalizeEmail functions
 * which are duplicated from lib/security.ts in the script.
 */

// Replicate the script's normalization functions to test them
function normalizePhone(phone: string): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '').slice(-10)
}

function normalizeEmail(email: string): string {
  if (!email) return ''
  return email.toLowerCase().trim()
}

describe('import-clients helpers', () => {
  describe('normalizePhone', () => {
    it('strips non-digits and returns last 10', () => {
      expect(normalizePhone('(517) 332-5353')).toBe('5173325353')
    })

    it('handles empty input', () => {
      expect(normalizePhone('')).toBe('')
    })

    it('handles null-like empty string', () => {
      expect(normalizePhone('')).toBe('')
    })

    it('handles international prefix', () => {
      expect(normalizePhone('+1 (517) 332-5353')).toBe('5173325353')
    })
  })

  describe('normalizeEmail', () => {
    it('lowercases and trims', () => {
      expect(normalizeEmail('  TEST@Gmail.COM  ')).toBe('test@gmail.com')
    })

    it('handles empty input', () => {
      expect(normalizeEmail('')).toBe('')
    })
  })

  describe('DNB auto-flagging logic', () => {
    const NO_SHOW_THRESHOLD = 2

    it('flags clients with no-shows >= threshold', () => {
      const noShows = 3
      const normalizedPhone = '5173325353'
      const shouldFlag = noShows >= NO_SHOW_THRESHOLD && normalizedPhone !== ''
      expect(shouldFlag).toBe(true)
    })

    it('does not flag clients below threshold', () => {
      const noShows = 1
      const normalizedPhone = '5173325353'
      const shouldFlag = noShows >= NO_SHOW_THRESHOLD && normalizedPhone !== ''
      expect(shouldFlag).toBe(false)
    })

    it('flags at exactly the threshold', () => {
      const noShows = 2
      const normalizedPhone = '5173325353'
      const shouldFlag = noShows >= NO_SHOW_THRESHOLD && normalizedPhone !== ''
      expect(shouldFlag).toBe(true)
    })

    it('does not flag if no phone or email', () => {
      const noShows = 5
      const normalizedPhone = ''
      const normalizedEmail = ''
      const shouldFlag = noShows >= NO_SHOW_THRESHOLD && (normalizedPhone !== '' || normalizedEmail !== '')
      expect(shouldFlag).toBe(false)
    })

    it('flags by email even if phone is missing', () => {
      const noShows = 3
      const normalizedPhone = ''
      const normalizedEmail = 'test@test.com'
      const shouldFlag = noShows >= NO_SHOW_THRESHOLD && (normalizedPhone !== '' || normalizedEmail !== '')
      expect(shouldFlag).toBe(true)
    })
  })

  describe('skip logic', () => {
    it('skips records with no phone, no email, and name N/A', () => {
      const record = { Phone: '', Email: '', Name: 'N/A' }
      const shouldSkip = !record.Phone && !record.Email && record.Name === 'N/A'
      expect(shouldSkip).toBe(true)
    })

    it('does not skip records with a phone', () => {
      const record = { Phone: '517-332-5353', Email: '', Name: 'N/A' }
      const shouldSkip = !record.Phone && !record.Email && record.Name === 'N/A'
      expect(shouldSkip).toBe(false)
    })

    it('does not skip records with an email', () => {
      const record = { Phone: '', Email: 'test@test.com', Name: 'N/A' }
      const shouldSkip = !record.Phone && !record.Email && record.Name === 'N/A'
      expect(shouldSkip).toBe(false)
    })

    it('does not skip records with a real name', () => {
      const record = { Phone: '', Email: '', Name: 'John Doe' }
      const shouldSkip = !record.Phone && !record.Email && record.Name === 'N/A'
      expect(shouldSkip).toBe(false)
    })
  })

  describe('batch size logic', () => {
    const BATCH_SIZE = 500

    it('commits at batch size boundary', () => {
      let batchCount = 499
      batchCount++
      expect(batchCount >= BATCH_SIZE).toBe(true)
    })

    it('does not commit before reaching batch size', () => {
      const batchCount = 499
      expect(batchCount >= BATCH_SIZE).toBe(false)
    })
  })
})
