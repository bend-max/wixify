import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Style Generator',
  description: 'Generate images in your style',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-950 text-white min-h-screen">{children}</body>
    </html>
  )
}
