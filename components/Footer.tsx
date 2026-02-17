import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-noir-500 text-ivory border-t border-crimson/10">
      <div className="divider-glow" />

      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Campus Barbers" className="w-12 h-12 rounded-full" />
                <div>
                  <span className="font-display text-ivory text-2xl font-semibold block">
                    Campus Barbers
                  </span>
                  <span className="text-crimson/60 text-sm tracking-wider">Est. 1952</span>
                </div>
              </Link>
              <p className="text-ivory/40 max-w-sm leading-relaxed">
                The original barbershop serving Michigan State University and East Lansing for over 70 years.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-display font-semibold text-rose-gold mb-4 tracking-wider text-sm uppercase">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#services" className="text-ivory/40 hover:text-ivory transition-colors duration-300">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#team" className="text-ivory/40 hover:text-ivory transition-colors duration-300">
                    Our Barbers
                  </a>
                </li>
                <li>
                  <a href="#location" className="text-ivory/40 hover:text-ivory transition-colors duration-300">
                    Location
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-display font-semibold text-rose-gold mb-4 tracking-wider text-sm uppercase">Contact</h3>
              <ul className="space-y-2 text-ivory/40">
                <li>
                  <a href="tel:+15173379881" className="hover:text-ivory transition-colors duration-300">
                    (517) 337-9881
                  </a>
                </li>
                <li>621 E Grand River Ave</li>
                <li>East Lansing, MI 48823</li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="divider-glow mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-ivory/20 text-sm">
              &copy; {currentYear} Campus Barbers Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/staff" className="text-ivory/20 hover:text-ivory/40 text-sm transition-colors duration-300">
                Staff Login
              </Link>
              <Link href="/admin" className="text-ivory/20 hover:text-ivory/40 text-sm transition-colors duration-300">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
