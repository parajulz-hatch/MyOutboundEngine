import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hatch Outbound Engine',
  description: 'AI-powered outbound sequences for Hatch sleep products',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
