import './globals.css'

export const metadata = {
  title: 'Gold & Silver Price Tracker - Live India Rates',
  description: 'Live gold and silver prices in India with import duty calculations',
  keywords: 'gold price, silver price, india, live rates',
  authors: [{ name: 'Gold Price Tracker' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {children}
      </body>
    </html>
  )
}
