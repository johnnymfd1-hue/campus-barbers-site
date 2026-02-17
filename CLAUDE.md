# Campus Barbers Inc.

Barbershop booking site for Campus Barbers Inc., 621 E Grand River Ave, East Lansing, MI 48823. Operating since 1952.

## Tech Stack
- Next.js 14, React 18, TypeScript, Tailwind CSS
- Firebase Firestore (database), Firebase Auth (admin/staff login)
- Deployed on Vercel

## Team
- John (owner, admin) — johnnymfd1@campusbarbersinc.com
- Nicholas (staff barber)
- Jason Schlee (staff barber)

## Services & Pricing
- Regular Haircut: $30
- Senior Cut: $25
- Kids Cut: $25
- Beard Trim: $15
- Haircut + Beard: $40

## Key Collections (Firestore)
- `appointments` — bookings with service, barber, date, time, status
- `clients` — full client profiles (admin only)
- `clientsPublic` — name-only records for staff
- `doNotBook` — blocked clients
- `evidence` — security audit log
- `bookingLogs` — booking analytics

## Scripts
- `npm run pnl` — Generate PNL report (current month)
- `npm run pnl:expenses` — Set monthly expenses
- `npm run import-clients` — Import clients from CSV

## Security
- Staff cannot see client phone/email/history (enforced at DB level)
- Honeypot + rate limiting + fingerprinting on booking form
- Non-solicitation agreement gate for staff access
