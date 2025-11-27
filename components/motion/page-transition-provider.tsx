'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { pageVariants } from '@/lib/motion/variants'

interface PageTransitionProviderProps {
  children: ReactNode
  className?: string
}

/**
 * Page transition provider that animates page content on route changes.
 * Uses pathname as key to trigger animations on navigation.
 */
export function PageTransitionProvider({ children, className }: PageTransitionProviderProps) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="enter"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Simpler CSS-based page transition that works without Framer Motion.
 * Uses CSS animations for better performance.
 */
export function CSSPageTransition({ children, className }: PageTransitionProviderProps) {
  const pathname = usePathname()

  return (
    <div key={pathname} className={`animate-fadeIn ${className || ''}`}>
      {children}
    </div>
  )
}
