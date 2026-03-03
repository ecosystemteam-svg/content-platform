import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Must-Reads for You | บทความคัดสรรเพื่อคุณ',
  description: 'บทความคัดสรรเพื่อคุณ — Must-Reads for You',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-slate-50 text-slate-900">
        <div className="max-w-[480px] mx-auto min-h-screen bg-slate-50 relative">
          {children}
        </div>
      </body>
    </html>
  )
}
