'use client'

import { motion } from 'framer-motion'
import { ReactNode, Children, isValidElement, cloneElement } from 'react'
import {
  staggerContainerVariants,
  staggerItemVariants,
  fastStaggerContainerVariants,
  createStaggerContainer,
} from '@/lib/motion/variants'

interface AnimatedListProps {
  children: ReactNode
  className?: string
  /** Custom stagger delay between items (default: 0.05s) */
  staggerDelay?: number
  /** Use faster animation for small items */
  fast?: boolean
  /** Disable animations (useful for reduced motion preference) */
  disabled?: boolean
}

/**
 * Animated list container that staggers children animations.
 * Children will animate in sequence with a slight delay between each.
 */
export function AnimatedList({
  children,
  className,
  staggerDelay,
  fast = false,
  disabled = false,
}: AnimatedListProps) {
  if (disabled) {
    return <div className={className}>{children}</div>
  }

  const containerVariants = staggerDelay
    ? createStaggerContainer(staggerDelay)
    : fast
      ? fastStaggerContainerVariants
      : staggerContainerVariants

  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedListItemProps {
  children: ReactNode
  className?: string
  /** Override default item variants */
  custom?: number
}

/**
 * Individual item in an AnimatedList.
 * Must be a direct child of AnimatedList for stagger to work.
 */
export function AnimatedListItem({
  children,
  className,
  custom,
}: AnimatedListItemProps) {
  return (
    <motion.div variants={staggerItemVariants} custom={custom} className={className}>
      {children}
    </motion.div>
  )
}

interface AnimatedGridProps {
  children: ReactNode
  className?: string
  /** Number of columns for stagger calculation */
  columns?: number
  /** Stagger delay between items */
  staggerDelay?: number
}

/**
 * Animated grid container with stagger animation.
 * Similar to AnimatedList but optimized for grid layouts.
 */
export function AnimatedGrid({
  children,
  className,
  columns = 3,
  staggerDelay = 0.05,
}: AnimatedGridProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      variants={createStaggerContainer(staggerDelay)}
      className={className}
    >
      {children}
    </motion.div>
  )
}
