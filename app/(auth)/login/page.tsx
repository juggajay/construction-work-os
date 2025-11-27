'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    startTransition(async () => {
      const result = await login(data)

      if (result.success) {
        router.refresh()
        window.location.href = '/dashboard'
      } else {
        setError(result.error || 'Failed to sign in')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        className="text-center space-y-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="text-white/50">
          Sign in to continue to your projects
        </p>
      </motion.div>

      {/* Login card */}
      <motion.div
        className={cn(
          "relative rounded-2xl p-6 sm:p-8",
          "bg-white/[0.03] backdrop-blur-xl",
          "border border-white/[0.06]"
        )}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {error && (
            <motion.div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl",
                "bg-red-500/10 border border-red-500/20",
                "text-red-400"
              )}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white/70"
            >
              Email address
            </label>
            <div className="relative">
              <div className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
                focusedField === 'email' ? "text-amber-400" : "text-white/30"
              )}>
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                disabled={isPending}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className={cn(
                  "w-full pl-12 pr-4 h-12 text-base rounded-xl",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white placeholder:text-white/30",
                  "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/70"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
                focusedField === 'password' ? "text-amber-400" : "text-white/30"
              )}>
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                disabled={isPending}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={cn(
                  "w-full pl-12 pr-12 h-12 text-base rounded-xl",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white placeholder:text-white/30",
                  "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl",
              "bg-gradient-to-r from-amber-500 to-amber-600 text-black",
              "shadow-lg shadow-amber-500/25",
              "hover:shadow-xl hover:shadow-amber-500/30",
              "transition-all duration-200",
              "disabled:opacity-70 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0a] px-3 text-white/30">
                Or continue with
              </span>
            </div>
          </div>

          {/* Magic link option */}
          <Link
            href="/magic-link"
            className={cn(
              "flex items-center justify-center gap-2 w-full h-12",
              "text-base font-medium rounded-xl",
              "bg-white/[0.03] border border-white/[0.08]",
              "text-white/70 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12]",
              "transition-all duration-200"
            )}
          >
            <Sparkles className="h-5 w-5 text-amber-400" />
            Sign in with magic link
          </Link>
        </form>
      </motion.div>

      {/* Sign up link */}
      <motion.p
        className="text-center text-sm text-white/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          Create account
        </Link>
      </motion.p>

      {/* Trust badges */}
      <motion.div
        className="flex items-center justify-center gap-6 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 text-white/30">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-xs">Secure login</span>
        </div>
        <div className="flex items-center gap-2 text-white/30">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-xs">256-bit encryption</span>
        </div>
      </motion.div>
    </div>
  )
}
