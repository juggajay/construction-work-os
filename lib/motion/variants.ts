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
