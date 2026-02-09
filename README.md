# Campus Barbers Inc. - Booking System

**Est. 1952 | East Lansing, MI**

Custom booking system with role-based access control, anti-harassment security, and frictionless client experience.

## 🔒 Security Features

### The John Dowen Rule
Staff members (Nic, Jason) can ONLY see:
- Client name
- Service
- Appointment time

They CANNOT see:
- Phone numbers
- Email addresses
- Notes
- Client history

This is enforced at the **database level** via Firestore Security Rules.

### Anti-Harassment System

1. **Honeypot Fields** - Hidden form fields that bots auto-fill. If filled:
   - Request is logged to Evidence Box
   - Fake success returned (bot thinks it worked)
   - No booking is created

2. **Device Fingerprinting** - Captures:
   - Real IP (even through Cloudflare)
   - User agent
   - Screen resolution
   - Timezone
   - Browser language

3. **Do Not Book (DNB) List** - Silently blocks problematic clients:
   - Auto-flagged if 2+ no-shows (from import)
   - Manual blocking by admin
   - Client sees fake success, never knows they're blocked

4. **Evidence Box** - Admin-only log of:
   - All honeypot triggers
   - All DNB block attempts
   - IP addresses for pattern detection

5. **Rate Limiting** - 5 requests/minute per IP

### Frictionless Return Visits
- Device fingerprint stored on first visit
- Returning clients auto-recognized
- Form pre-populates their info
- No passwords to remember

## 👥 Roles

| Role | Access |
|------|--------|
| **Admin** (You) | Everything: full client data, DNB list, evidence box, all settings |
| **Staff** (Nic, Jason) | Appointments only: client name, service, time |
| **Public** | Book appointments (guest, no account) |

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- Firebase project (Spark plan - free)
- Vercel account (free)

### Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: `campus-barbers`
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** → Start in test mode
5. Go to Project Settings → Service Accounts → Generate new private key

### Step 2: Create Users in Firebase

In Firebase Console → Authentication → Users, create:

1. **Admin (You)**
   - Email: your_email@domain.com
   - Password: (secure password)

2. **Staff**
   - jencn90@gmail.com (Nicholas)
   - schlee21@yahoo.com (Jason)

Then in Firestore, create a `users` collection with documents:

```
users/
  {admin_uid}/
    email: "your_email@domain.com"
    role: "admin"
    name: "John"
  
  {nic_uid}/
    email: "jencn90@gmail.com"
    role: "staff"
    name: "Nicholas"
  
  {jason_uid}/
    email: "schlee21@yahoo.com"
    role: "staff"
    name: "Jason Schlee"
```

### Step 3: Deploy Firestore Rules

Copy `firestore.rules` to Firebase Console → Firestore → Rules → Publish

### Step 4: Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase values.

### Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables (prompted)
# Or set in Vercel dashboard → Project → Settings → Environment Variables
```

### Step 6: Import Existing Clients

```bash
# Place your Setmore CSV export as clients.csv
# Run import script
npm run import-clients
```

## 📁 Project Structure

```
campus-barbers/
├── app/
│   ├── page.tsx              # Main website + booking
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Styles
│   ├── admin/
│   │   ├── page.tsx          # Admin login
│   │   └── dashboard/
│   │       └── page.tsx      # Admin dashboard (full access)
│   ├── staff/
│   │   ├── page.tsx          # Staff login
│   │   └── dashboard/
│   │       └── page.tsx      # Staff dashboard (limited)
│   └── api/
│       └── book/
│           └── route.ts      # Booking API with security
├── components/
│   ├── Navigation.tsx
│   ├── BookingForm.tsx       # With honeypot + fingerprinting
│   └── Footer.tsx
├── lib/
│   ├── firebase.ts           # Client SDK
│   ├── firebase-admin.ts     # Server SDK
│   └── security.ts           # Security utilities
├── scripts/
│   └── import-clients.js     # CSV import + DNB flagging
├── firestore.rules           # Database security
└── package.json
```

## 💰 Cost

| Service | Cost |
|---------|------|
| Vercel (Free tier) | $0 |
| Firebase Spark (Free tier) | $0 |
| **Total** | **$0/month** |

Firebase Spark limits:
- 50K Firestore reads/day
- 20K Firestore writes/day
- 1GB storage

More than enough for a barbershop.

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

## 📞 Support

If there are issues, check:
1. Firebase Console for errors
2. Vercel logs for API errors
3. Evidence Box for security events

---

Built with security and privacy as the foundation. Staff can do their job without access to data they don't need.
