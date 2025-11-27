import { Variants, Transition } from 'framer-motion'

// ===== TIMING CONSTANTS =====
export const DURATIONS = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.5,
} as const

export const EASINGS = {
  smooth: [0.4, 0, 0.2, 1],
  smoothOut: [0, 0, 0.2, 1],
  smoothIn: [0.4, 0, 1, 1],
  spring: [0.175, 0.885, 0.32, 1.275],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const

// ===== BASE TRANSITIONS =====
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}

export const smoothTransition: Transition = {
  duration: DURATIONS.normal,
  ease: EASINGS.smooth,
}

export const slowTransition: Transition = {
  duration: DURATIONS.slow,
  ease: EASINGS.smooth,
}

// ===== PAGE TRANSITIONS =====
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.slow,
      ease: EASINGS.smoothOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.smoothIn,
    },
  },
}

// Slide from right (for drawers/sheets)
export const slideFromRightVariants: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  enter: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smoothIn,
    },
  },
}

// Slide from bottom (for mobile sheets)
export const slideFromBottomVariants: Variants = {
  initial: {
    y: '100%',
    opacity: 0,
  },
  enter: {
    y: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smoothIn,
    },
  },
}

// ===== LIST ANIMATIONS =====
export const staggerContainerVariants: Variants = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATIONS.fast,
    },
  },
}

// Fast stagger for small items (badges, chips)
export const fastStaggerContainerVariants: Variants = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.03,
    },
  },
}

// ===== CARD ANIMATIONS =====
export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: DURATIONS.fast,
    },
  },
}

export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  },
  hover: {
    y: -4,
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
    },
  },
  tap: {
    y: -2,
    scale: 0.98,
    transition: {
      duration: DURATIONS.fast,
    },
  },
}

// ===== BUTTON ANIMATIONS =====
export const buttonPressVariants: Variants = {
  initial: {
    scale: 1,
  },
  tap: {
    scale: 0.97,
    transition: {
      duration: 0.1,
    },
  },
}

export const buttonHoverVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: DURATIONS.fast,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
}

// ===== FEEDBACK ANIMATIONS =====
export const successVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  enter: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: DURATIONS.fast,
    },
  },
}

export const checkmarkVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  enter: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.4,
        ease: EASINGS.smoothOut,
      },
      opacity: {
        duration: 0.1,
      },
    },
  },
}

// Pulse animation for celebratory moments
export const pulseVariants: Variants = {
  initial: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.4,
      times: [0, 0.5, 1],
    },
  },
}

// ===== OVERLAY ANIMATIONS =====
export const overlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: DURATIONS.normal,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATIONS.fast,
    },
  },
}

export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: DURATIONS.fast,
    },
  },
}

// ===== LOADING ANIMATIONS =====
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
}

export const dotPulseVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0.5,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
}

// ===== TOOLTIP/POPOVER ANIMATIONS =====
export const tooltipVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 4,
  },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.smoothOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    transition: {
      duration: 0.1,
    },
  },
}

// ===== NOTIFICATION ANIMATIONS =====
export const notificationVariants: Variants = {
  initial: {
    opacity: 0,
    x: 50,
    scale: 0.9,
  },
  enter: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.9,
    transition: {
      duration: DURATIONS.normal,
    },
  },
}

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a stagger container with custom delay
 */
export function createStaggerContainer(staggerDelay: number = 0.05): Variants {
  return {
    initial: {},
    enter: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
    exit: {
      transition: {
        staggerChildren: staggerDelay / 2,
        staggerDirection: -1,
      },
    },
  }
}

/**
 * Creates a fade-slide animation with custom direction
 */
export function createSlideVariants(
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 20
): Variants {
  const isVertical = direction === 'up' || direction === 'down'
  const sign = direction === 'up' || direction === 'left' ? 1 : -1

  if (isVertical) {
    return {
      initial: { opacity: 0, y: distance * sign },
      enter: { opacity: 1, y: 0, transition: smoothTransition },
      exit: { opacity: 0, y: distance * sign * -0.5, transition: { duration: DURATIONS.fast } },
    }
  }
  return {
    initial: { opacity: 0, x: distance * sign },
    enter: { opacity: 1, x: 0, transition: smoothTransition },
    exit: { opacity: 0, x: distance * sign * -0.5, transition: { duration: DURATIONS.fast } },
  }
}

// ===== APPLE/STRIPE-INSPIRED VARIANTS =====

// Subtle scale with shadow for premium feel
export const premiumCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATIONS.slow,
      ease: EASINGS.smoothOut,
    },
  },
  hover: {
    y: -8,
    scale: 1.01,
    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
    },
  },
  tap: {
    scale: 0.99,
    y: -4,
    transition: {
      duration: DURATIONS.fast,
    },
  },
}

// Construction brand glow effect
export const glowVariants: Variants = {
  initial: {
    boxShadow: '0 0 0 0 rgba(255, 107, 53, 0)',
  },
  hover: {
    boxShadow: '0 0 40px 10px rgba(255, 107, 53, 0.15)',
    transition: {
      duration: DURATIONS.normal,
    },
  },
}

// Parallax scroll effect
export const parallaxVariants: Variants = {
  offscreen: {
    y: 100,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      duration: DURATIONS.slower,
    },
  },
}

// Hero section stagger
export const heroContainerVariants: Variants = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const heroItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.slow,
      ease: EASINGS.smoothOut,
    },
  },
}

// Field worker mode - high contrast animations
export const fieldModeVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATIONS.fast,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.97,
    transition: {
      duration: 0.05,
    },
  },
}

// FAB menu expansion
export const fabMenuVariants: Variants = {
  closed: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    pointerEvents: 'none' as const,
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    pointerEvents: 'auto' as const,
    transition: springTransition,
  },
}

export const fabItemVariants: Variants = {
  closed: {
    opacity: 0,
    y: 10,
    scale: 0.8,
  },
  open: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      ...springTransition,
    },
  }),
}

// Data visualization animations
export const chartBarVariants: Variants = {
  initial: {
    scaleY: 0,
    originY: 1,
  },
  enter: (i: number) => ({
    scaleY: 1,
    transition: {
      delay: i * 0.05,
      duration: DURATIONS.slow,
      ease: EASINGS.smoothOut,
    },
  }),
}

export const chartLineVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  enter: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 1,
        ease: EASINGS.smoothOut,
      },
      opacity: {
        duration: DURATIONS.fast,
      },
    },
  },
}

// Counter/number animation
export const counterVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smoothOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATIONS.fast,
    },
  },
}

// Shake for validation errors
export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
}

// Bounce for success/attention
export const bounceVariants: Variants = {
  bounce: {
    y: [0, -15, 0],
    transition: {
      duration: 0.4,
      ease: EASINGS.bounce,
    },
  },
}

// ===== REDUCED MOTION SUPPORT =====

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get variants with reduced motion fallback
 */
export function withReducedMotion<T extends Variants>(
  variants: T,
  reducedVariants?: Partial<T>
): T {
  if (prefersReducedMotion()) {
    return {
      ...variants,
      initial: { opacity: 0 },
      enter: { opacity: 1, transition: { duration: 0.01 } },
      exit: { opacity: 0, transition: { duration: 0.01 } },
      ...reducedVariants,
    } as T
  }
  return variants
}

// ===== GESTURE UTILITIES =====

/**
 * Standard hover/tap animation for interactive elements
 */
export const interactiveVariants = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: DURATIONS.fast },
}

/**
 * Subtle hover/tap for field worker mode (larger targets)
 */
export const fieldInteractiveVariants = {
  whileHover: { scale: 1.01, backgroundColor: 'rgba(255, 107, 53, 0.05)' },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.1 },
}
