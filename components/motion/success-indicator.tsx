'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, CheckCircle2, PartyPopper, Sparkles } from 'lucide-react'
import { successVariants, checkmarkVariants, pulseVariants } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface SuccessIndicatorProps {
  show: boolean
  className?: string
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg'
  /** Variant style */
  variant?: 'check' | 'circle' | 'celebration' | 'sparkle'
  /** Optional message to display */
  message?: string
  /** Auto-hide after duration (ms). Set to 0 to disable */
  autoDismiss?: number
  /** Callback when dismissed */
  onDismiss?: () => void
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
}

const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
}

/**
 * Animated success indicator for celebratory feedback.
 * Use after successful form submissions, completions, etc.
 */
export function SuccessIndicator({
  show,
  className,
  size = 'md',
  variant = 'circle',
  message,
  autoDismiss = 2000,
  onDismiss,
}: SuccessIndicatorProps) {
  // Auto-dismiss effect
  if (show && autoDismiss > 0 && onDismiss) {
    setTimeout(onDismiss, autoDismiss)
  }

  const Icon = {
    check: Check,
    circle: CheckCircle2,
    celebration: PartyPopper,
    sparkle: Sparkles,
  }[variant]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial="initial"
          animate="enter"
          exit="exit"
          variants={successVariants}
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            className
          )}
        >
          <motion.div
            variants={pulseVariants}
            initial="initial"
            animate="pulse"
            className={cn(
              'flex items-center justify-center rounded-full',
              'bg-success/10 text-success',
              sizeClasses[size]
            )}
          >
            <Icon size={iconSizes[size]} strokeWidth={2.5} />
          </motion.div>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-medium text-success"
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface AnimatedCheckmarkProps {
  show: boolean
  className?: string
  size?: number
  color?: string
}

/**
 * Animated checkmark with drawing effect.
 * Great for completion states and confirmations.
 */
export function AnimatedCheckmark({
  show,
  className,
  size = 24,
  color = 'currentColor',
}: AnimatedCheckmarkProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          initial="initial"
          animate="enter"
          exit="exit"
          variants={successVariants}
          className={className}
        >
          <motion.path
            d="M5 13l4 4L19 7"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={checkmarkVariants}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  )
}

interface ConfettiProps {
  show: boolean
  onComplete?: () => void
}

/**
 * Simple confetti burst animation.
 * Use sparingly for major achievements.
 */
export function ConfettiBurst({ show, onComplete }: ConfettiProps) {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30 * Math.PI) / 180,
    delay: Math.random() * 0.2,
    color: ['#FF6B35', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'][i % 5],
  }))

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: `calc(50% + ${Math.cos(particle.angle) * 100}px)`,
                y: `calc(50% + ${Math.sin(particle.angle) * 100}px)`,
                scale: [0, 1, 0.5],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: particle.delay,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute h-2 w-2 rounded-full"
              style={{ backgroundColor: particle.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
