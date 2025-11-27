'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { pageVariants } from '@/lib/motion/variants'

interface AnimatedPageProps {
  children: ReactNode
  className?: string
}

/**
 * Animated page wrapper for smooth page transitions.
 * Wrap your page content with this component for enter/exit animations.
 */
export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedPresenceWrapperProps {
  children: ReactNode
  mode?: 'sync' | 'wait' | 'popLayout'
}

/**
 * Wrapper for AnimatePresence to enable exit animations.
 * Use this at the layout level to enable page transitions.
 */
export function AnimatedPresenceWrapper({
  children,
  mode = 'wait',
}: AnimatedPresenceWrapperProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>
}
