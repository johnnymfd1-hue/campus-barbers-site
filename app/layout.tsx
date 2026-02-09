import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Campus Barbers | Est. 1952 | East Lansing, MI',
  description: 'The original barbershop serving Michigan State University and East Lansing since 1952. Classic cuts, modern style. Book your appointment today.',
  keywords: ['barber', 'haircut', 'East Lansing', 'MSU', 'Michigan State', 'barbershop', 'mens haircut'],
  authors: [{ name: 'Campus Barbers Inc.' }],
  openGraph: {
    title: 'Campus Barbers | Est. 1952',
    description: 'The original barbershop serving MSU and East Lansing since 1952.',
    url: 'https://campusbarbers.com',
    siteName: 'Campus Barbers',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#18453B" />
      </head>
      <body className="min-h-screen bg-cream">
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
