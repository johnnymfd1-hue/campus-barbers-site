import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-spartan-500 text-cream py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Campus Barbers" className="w-12 h-12 rounded-full" />
              <div>
                <span className="font-display text-cream text-2xl font-semibold block">
                  Campus Barbers
                </span>
                <span className="text-cream/50 text-sm">Est. 1952</span>
              </div>
            </Link>
            <p className="text-cream/60 max-w-sm">
              The original barbershop serving Michigan State University and East Lansing for over 70 years.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-gold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#services" className="text-cream/60 hover:text-cream transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#team" className="text-cream/60 hover:text-cream transition-colors">
                  Our Barbers
                </a>
              </li>
              <li>
                <a href="#location" className="text-cream/60 hover:text-cream transition-colors">
                  Location
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-gold mb-4">Contact</h3>
            <ul className="space-y-2 text-cream/60">
              <li>
                <a href="tel:+15173379881" className="hover:text-cream transition-colors">
                  (517) 337-9881
                </a>
              </li>
              <li>621 E Grand River Ave</li>
              <li>East Lansing, MI 48823</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-cream/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-cream/40 text-sm">
              © {currentYear} Campus Barbers Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/staff" className="text-cream/40 hover:text-cream/60 text-sm transition-colors">
                Staff Login
              </Link>
              <Link href="/admin" className="text-cream/40 hover:text-cream/60 text-sm transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
