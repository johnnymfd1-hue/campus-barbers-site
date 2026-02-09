// Security utilities for Campus Barbers
// Handles: Fingerprinting, Honeypot detection, IP capture, Evidence logging

import { headers } from 'next/headers'

export interface DeviceFingerprint {
  ip: string
  userAgent: string
  acceptLanguage: string
  screenResolution?: string
  timezone?: string
  fingerprint: string
}

export interface EvidenceRecord {
  timestamp: string
  ip: string
  userAgent: string
  referrer: string
  path: string
  method: string
  honeypotTriggered: boolean
  honeypotValue?: string
  clientFingerprint?: string
  additionalData?: Record<string, unknown>
}

/**
 * Get the real IP address, even behind Cloudflare or other proxies
 */
export function getRealIP(): string {
  const headersList = headers()
  
  // Cloudflare
  const cfIP = headersList.get('cf-connecting-ip')
  if (cfIP) return cfIP
  
  // Standard proxy headers
  const xForwardedFor = headersList.get('x-forwarded-for')
  if (xForwardedFor) {
    // Take the first IP (original client)
    return xForwardedFor.split(',')[0].trim()
  }
  
  const xRealIP = headersList.get('x-real-ip')
  if (xRealIP) return xRealIP
  
  // Vercel
  const vercelIP = headersList.get('x-vercel-forwarded-for')
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  // Fallback
  return 'unknown'
}

/**
 * Get all request metadata for evidence logging
 */
export function getRequestMetadata(): Omit<EvidenceRecord, 'honeypotTriggered' | 'honeypotValue' | 'timestamp'> {
  const headersList = headers()
  
  return {
    ip: getRealIP(),
    userAgent: headersList.get('user-agent') || 'unknown',
    referrer: headersList.get('referer') || headersList.get('referrer') || 'direct',
    path: headersList.get('x-invoke-path') || 'unknown',
    method: headersList.get('x-invoke-method') || 'unknown',
  }
}

/**
 * Generate a simple fingerprint hash from device characteristics
 * This is used for recognizing returning clients without passwords
 */
export function generateFingerprint(data: {
  ip: string
  userAgent: string
  acceptLanguage?: string
  screenResolution?: string
  timezone?: string
}): string {
  const str = [
    data.userAgent,
    data.acceptLanguage || '',
    data.screenResolution || '',
    data.timezone || '',
  ].join('|')
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Check if honeypot field was filled (bot detection)
 */
export function isHoneypotTriggered(formData: FormData | Record<string, unknown>): { triggered: boolean; value?: string } {
  // Check multiple honeypot field names
  const honeypotFields = ['website', 'url', 'company', 'fax', 'hp_field', 'address2']
  
  for (const field of honeypotFields) {
    let value: string | undefined
    
    if (formData instanceof FormData) {
      value = formData.get(field) as string | null || undefined
    } else {
      value = formData[field] as string | undefined
    }
    
    if (value && value.trim() !== '') {
      return { triggered: true, value }
    }
  }
  
  return { triggered: false }
}

/**
 * Create an evidence record for logging suspicious activity
 */
export function createEvidenceRecord(
  honeypotTriggered: boolean,
  honeypotValue?: string,
  additionalData?: Record<string, unknown>
): EvidenceRecord {
  const metadata = getRequestMetadata()
  
  return {
    ...metadata,
    timestamp: new Date().toISOString(),
    honeypotTriggered,
    honeypotValue,
    additionalData,
  }
}

/**
 * Check if a client should be silently blocked (Do Not Book list)
 */
export interface DNBCheckResult {
  blocked: boolean
  reason?: string
  clientId?: string
}

/**
 * Normalize phone number for matching
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

/**
 * Normalize email for matching
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Rate limiting helper - tracks requests per IP
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}
