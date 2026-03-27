import './globals.css'

export const metadata = {
  title: 'Gold & Silver Price Tracker - Live India Rates',
  description: 'Live gold and silver prices in India with import duty calculations. Real-time updates every 2 seconds.',
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
