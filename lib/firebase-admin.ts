import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

let _app: App | null = null
let _db: Firestore | null = null
let _auth: Auth | null = null

function getOrInitApp(): App {
  if (_app) return _app
  if (getApps().length > 0) {
    _app = getApps()[0]
    return _app
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set')
  }

  _app = initializeApp({
    credential: cert(JSON.parse(raw)),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
  return _app
}

export function getAdminDb(): Firestore {
  if (!_db) _db = getFirestore(getOrInitApp())
  return _db
}

export function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(getOrInitApp())
  return _auth
}

// Keep backward compat — but these are now getter-based
export const adminDb = new Proxy({} as Firestore, {
  get(_, prop, receiver) {
    const db = getAdminDb()
    const val = (db as any)[prop]
    if (typeof val === 'function') return val.bind(db)
    return val
  },
})

export const adminAuth = new Proxy({} as Auth, {
  get(_, prop, receiver) {
    const a = getAdminAuth()
    const val = (a as any)[prop]
    if (typeof val === 'function') return val.bind(a)
    return val
  },
})
