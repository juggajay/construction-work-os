'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Mail,
  Lock,
  ArrowRight,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Check,
  Building2,
  HardHat,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signup } from '@/lib/actions/auth'

// Password strength rules
const passwordRules = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
]

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [password, setPassword] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)
    const data = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    startTransition(async () => {
      const result = await signup(data)

      if (!result.success) {
        if (result.error?.includes('Passwords do not match')) {
          setFieldErrors({ confirmPassword: 'Passwords do not match' })
        } else {
          setError(result.error || 'Failed to create account')
        }
        return
      }

      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="space-y-8">
        <motion.div
          className={cn(
            "relative rounded-2xl p-8 text-center",
            "bg-white/[0.03] backdrop-blur-xl",
            "border border-white/[0.06]"
          )}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* Success icon */}
          <motion.div
            className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
          >
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </motion.div>

          <motion.div
            className="mt-6 space-y-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-white">Check your email</h2>
            <p className="text-white/50">
              We&apos;ve sent you a confirmation link. Please check your email to verify your account.
            </p>
          </motion.div>

          <motion.div
            className="mt-8"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center justify-center w-full h-12",
                "rounded-xl font-medium",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-white/70 hover:text-white hover:bg-white/[0.06]",
                "transition-all duration-200"
              )}
            >
              Back to login
            </Link>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="text-center space-y-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Create an account
        </h1>
        <p className="text-white/50">
          Join thousands of construction teams already using Construction OS
        </p>
      </motion.div>

      {/* Signup card */}
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
        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Full Name field */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-white/70">
              Full Name
            </label>
            <div className="relative">
              <div className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
                focusedField === 'fullName' ? "text-amber-400" : "text-white/30"
              )}>
                <User className="h-5 w-5" />
              </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Smith"
                required
                disabled={isPending}
                onFocus={() => setFocusedField('fullName')}
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

          {/* Email field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-white/70">
              Work Email
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
            <label htmlFor="password" className="block text-sm font-medium text-white/70">
              Password
            </label>
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
                placeholder="Create a strong password"
                required
                minLength={8}
                disabled={isPending}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* Password strength indicator */}
            {password.length > 0 && (
              <motion.div
                className="space-y-1.5 pt-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                {passwordRules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                      rule.test(password)
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/5 text-white/30"
                    )}>
                      {rule.test(password) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </div>
                    <span className={cn(
                      "transition-colors",
                      rule.test(password) ? "text-emerald-400" : "text-white/40"
                    )}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70">
              Confirm Password
            </label>
            <div className="relative">
              <div className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
                focusedField === 'confirmPassword' ? "text-amber-400" : "text-white/30"
              )}>
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                required
                minLength={8}
                disabled={isPending}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                className={cn(
                  "w-full pl-12 pr-12 h-12 text-base rounded-xl",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white placeholder:text-white/30",
                  "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  fieldErrors.confirmPassword && "border-red-500/50 focus:border-red-500/50"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl mt-2",
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
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Terms notice */}
          <p className="text-xs text-center text-white/40 pt-2">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-amber-400 hover:text-amber-300 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-amber-400 hover:text-amber-300 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </form>
      </motion.div>

      {/* Sign in link */}
      <motion.p
        className="text-center text-sm text-white/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          Sign in
        </Link>
      </motion.p>

      {/* Features preview */}
      <motion.div
        className="grid grid-cols-3 gap-4 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {[
          { icon: Building2, label: 'Project Tracking' },
          { icon: HardHat, label: 'Field Reports' },
          { icon: FileText, label: 'RFI Management' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl",
              "bg-white/[0.02] border border-white/[0.04]"
            )}
          >
            <Icon className="h-5 w-5 text-amber-400" />
            <span className="text-xs text-white/40 text-center">{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
