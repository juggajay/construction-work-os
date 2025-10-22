import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/providers/query-provider'

export const metadata: Metadata = {
  title: 'Construction Work OS',
  description: 'Construction-native Work OS for mid-market contractors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
