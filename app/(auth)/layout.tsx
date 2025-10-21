import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - Construction Work OS',
  description: 'Sign in to your construction project management account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Construction Work OS
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Construction-native project management
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
