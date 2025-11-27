import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ============================================
      // TOUCH TARGETS (Field Worker Optimized)
      // ============================================
      minHeight: {
        'touch': '44px',      // WCAG AA minimum
        'touch-lg': '48px',   // Recommended
        'touch-xl': '56px',   // Glove-friendly
        'touch-2xl': '64px',  // Maximum comfort
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
        'touch-xl': '56px',
        'touch-2xl': '64px',
      },
      height: {
        'touch': '44px',
        'touch-lg': '48px',
        'touch-xl': '56px',
        'touch-2xl': '64px',
        'field': '56px',       // Field worker input height
        'field-lg': '64px',
      },
      width: {
        'field': '56px',
        'field-lg': '64px',
      },

      // ============================================
      // TYPOGRAPHY SCALE (Mobile-First, Fluid)
      // ============================================
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      fontSize: {
        // Display - Hero headlines (fluid)
        'display-2xl': ['clamp(2.5rem, 8vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-xl': ['clamp(2.25rem, 6vw, 3.75rem)', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-lg': ['clamp(2rem, 5vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display': ['clamp(1.75rem, 4vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '700' }],

        // Headings
        'heading-xl': ['clamp(1.5rem, 3vw, 1.875rem)', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-lg': ['clamp(1.25rem, 2.5vw, 1.5rem)', { lineHeight: '1.3', fontWeight: '600' }],
        'heading': ['clamp(1.125rem, 2vw, 1.25rem)', { lineHeight: '1.35', fontWeight: '600' }],
        'heading-sm': ['1rem', { lineHeight: '1.4', fontWeight: '600' }],

        // Body - Optimized for mobile readability
        'body-xl': ['1.25rem', { lineHeight: '1.6' }],    // 20px - Large body
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],   // 18px - Primary mobile body
        'body': ['1rem', { lineHeight: '1.6' }],          // 16px - Standard
        'body-sm': ['0.9375rem', { lineHeight: '1.5' }],  // 15px - Secondary
        'body-xs': ['0.875rem', { lineHeight: '1.5' }],   // 14px - Compact

        // Utility
        'caption': ['0.8125rem', { lineHeight: '1.4' }],  // 13px
        'caption-sm': ['0.75rem', { lineHeight: '1.4' }], // 12px
        'overline': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.05em', fontWeight: '600' }], // 11px
        'tiny': ['0.625rem', { lineHeight: '1.4', letterSpacing: '0.02em' }], // 10px

        // Field worker sizes (larger for outdoor use)
        'field': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'field-lg': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
      },

      // ============================================
      // SPACING SYSTEM (8px Grid)
      // ============================================
      spacing: {
        '0.5': '0.125rem',   // 2px
        '1.5': '0.375rem',   // 6px
        '2.5': '0.625rem',   // 10px
        '3.5': '0.875rem',   // 14px
        '4.5': '1.125rem',   // 18px
        '5.5': '1.375rem',   // 22px
        '7': '1.75rem',      // 28px
        '9': '2.25rem',      // 36px
        '11': '2.75rem',     // 44px
        '13': '3.25rem',     // 52px
        '15': '3.75rem',     // 60px
        '17': '4.25rem',     // 68px
        '18': '4.5rem',      // 72px
        '22': '5.5rem',      // 88px
        '26': '6.5rem',      // 104px
        '30': '7.5rem',      // 120px
        '34': '8.5rem',      // 136px
        '38': '9.5rem',      // 152px
        '42': '10.5rem',     // 168px
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',     // 4px - Small elements
        'DEFAULT': '0.5rem', // 8px - Buttons, inputs
        'md': '0.625rem',    // 10px
        'lg': '0.75rem',     // 12px - Cards
        'xl': '1rem',        // 16px - Large cards
        '2xl': '1.25rem',    // 20px - Modals
        '3xl': '1.5rem',     // 24px - Hero cards
        '4xl': '2rem',       // 32px - Feature sections
        'full': '9999px',    // Pills, avatars
      },

      // ============================================
      // SHADOWS & ELEVATION (Apple/Stripe inspired)
      // ============================================
      boxShadow: {
        // Light mode - refined, subtle
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        'DEFAULT': '0 2px 4px -1px rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        '3xl': '0 35px 60px -15px rgb(0 0 0 / 0.2)',

        // Inner shadows
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.03)',
        'inner-lg': 'inset 0 4px 8px 0 rgb(0 0 0 / 0.05)',

        // Colored shadows (light mode)
        'construction': '0 10px 40px -10px hsl(18 100% 60% / 0.3)',
        'construction-lg': '0 20px 60px -15px hsl(18 100% 60% / 0.35)',
        'success': '0 10px 30px -5px hsl(152 76% 36% / 0.25)',
        'warning': '0 10px 30px -5px hsl(38 92% 50% / 0.25)',
        'danger': '0 10px 30px -5px hsl(0 84% 60% / 0.25)',
        'info': '0 10px 30px -5px hsl(199 89% 48% / 0.25)',

        // Glass effect shadow
        'glass': '0 8px 32px 0 rgb(31 38 135 / 0.1)',
        'glass-lg': '0 12px 48px 0 rgb(31 38 135 / 0.15)',

        // Elevation system
        'elevation-1': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        'elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'elevation-4': '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
        'elevation-5': '0 25px 50px -12px rgb(0 0 0 / 0.15)',

        // Dark mode shadows
        'dark-sm': '0 2px 6px 0 rgb(0 0 0 / 0.4)',
        'dark-md': '0 4px 12px 0 rgb(0 0 0 / 0.5)',
        'dark-lg': '0 8px 24px 0 rgb(0 0 0 / 0.6)',
        'dark-xl': '0 16px 40px 0 rgb(0 0 0 / 0.7)',

        // Glow effects (dark mode)
        'glow-construction': '0 0 40px hsl(18 100% 55% / 0.2), 0 0 80px hsl(18 100% 55% / 0.1)',
        'glow-construction-sm': '0 0 20px hsl(18 100% 55% / 0.15)',
        'glow-success': '0 0 30px hsl(152 76% 45% / 0.2)',
        'glow-warning': '0 0 30px hsl(38 92% 55% / 0.2)',
        'glow-danger': '0 0 30px hsl(0 84% 55% / 0.2)',
        'glow-info': '0 0 30px hsl(199 89% 55% / 0.2)',

        // Button press effect
        'press': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)',

        // Card hover
        'card-hover': '0 20px 40px -15px rgb(0 0 0 / 0.1), 0 8px 16px -8px rgb(0 0 0 / 0.08)',
      },

      // ============================================
      // BACKDROP BLUR
      // ============================================
      backdropBlur: {
        'xs': '4px',
        'glass': '12px',
        'glass-lg': '20px',
        'glass-xl': '40px',
      },

      // ============================================
      // GRADIENTS
      // ============================================
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',

        // Construction brand gradients
        'gradient-construction': 'linear-gradient(135deg, hsl(18 100% 60%) 0%, hsl(24 95% 55%) 100%)',
        'gradient-construction-soft': 'linear-gradient(135deg, hsl(20 100% 97%) 0%, hsl(18 100% 93%) 100%)',
        'gradient-construction-dark': 'linear-gradient(135deg, hsl(18 100% 15%) 0%, hsl(24 95% 12%) 100%)',

        // Status gradients
        'gradient-success': 'linear-gradient(135deg, hsl(152 76% 40%) 0%, hsl(152 76% 32%) 100%)',
        'gradient-warning': 'linear-gradient(135deg, hsl(38 92% 55%) 0%, hsl(38 92% 45%) 100%)',
        'gradient-danger': 'linear-gradient(135deg, hsl(0 84% 60%) 0%, hsl(0 84% 50%) 100%)',
        'gradient-info': 'linear-gradient(135deg, hsl(199 89% 52%) 0%, hsl(199 89% 42%) 100%)',

        // Surface gradients
        'gradient-surface': 'linear-gradient(180deg, hsl(var(--surface-0)) 0%, hsl(var(--surface-1)) 100%)',
        'gradient-card': 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface-2)) 100%)',

        // Premium hero gradients
        'gradient-hero': 'linear-gradient(135deg, hsl(30 20% 99%) 0%, hsl(28 15% 96%) 50%, hsl(30 20% 99%) 100%)',
        'gradient-hero-dark': 'linear-gradient(135deg, hsl(20 10% 5%) 0%, hsl(22 8% 8%) 50%, hsl(20 10% 5%) 100%)',

        // Mesh gradient for hero sections
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsl(18 100% 60% / 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsl(24 95% 55% / 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsl(152 76% 36% / 0.05) 0px, transparent 50%)',
        'gradient-mesh-dark': 'radial-gradient(at 40% 20%, hsl(18 100% 55% / 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsl(24 95% 50% / 0.1) 0px, transparent 50%)',

        // Shimmer effect
        'gradient-shimmer': 'linear-gradient(90deg, transparent 25%, hsl(var(--muted-foreground) / 0.08) 50%, transparent 75%)',
      },

      // ============================================
      // ANIMATION TIMING FUNCTIONS
      // ============================================
      transitionTimingFunction: {
        'default': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'snappy': 'cubic-bezier(0.2, 0, 0, 1)',
      },

      // ============================================
      // ANIMATION DURATIONS
      // ============================================
      transitionDuration: {
        'instant': '50ms',
        'fast': '100ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
        'slowest': '700ms',
      },

      // ============================================
      // COLORS
      // ============================================
      colors: {
        // Core semantic colors (from CSS variables)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Surfaces
        surface: {
          '0': 'hsl(var(--surface-0))',
          '1': 'hsl(var(--surface-1))',
          '2': 'hsl(var(--surface-2))',
          '3': 'hsl(var(--surface-3))',
          '4': 'hsl(var(--surface-4))',
        },

        // Card
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Popover
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        // Primary
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },

        // Secondary
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        // Muted
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        // Accent
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        // Destructive
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        // Border, Input, Ring
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Chart colors
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },

        // Sidebar
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },

        // Status colors (from CSS variables)
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          muted: 'hsl(var(--success-muted))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          muted: 'hsl(var(--warning-muted))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
          muted: 'hsl(var(--danger-muted))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          muted: 'hsl(var(--info-muted))',
        },

        // ============================================
        // CONSTRUCTION BRAND PALETTE (Warm)
        // ============================================
        construction: {
          '50': '#FFF7F4',   // Lightest tint
          '100': '#FFEDE6',
          '200': '#FFD9CC',
          '300': '#FFC2AD',
          '400': '#FFA285',
          '500': '#FF6B35',  // Primary brand
          '600': '#F55A1E',
          '700': '#D94A0F',
          '800': '#B53D0C',
          '900': '#8A3009',
          '950': '#4D1804',  // Darkest shade
          DEFAULT: 'hsl(var(--construction))',
          foreground: 'hsl(var(--construction-foreground))',
          muted: 'hsl(var(--construction-muted))',
        },

        // ============================================
        // WARM GRAY PALETTE (Sand)
        // ============================================
        sand: {
          '50': '#FAF9F7',
          '100': '#F5F3EF',
          '200': '#EBE7E0',
          '300': '#DDD7CC',
          '400': '#C4BAA8',
          '500': '#A99D8A',
          '600': '#8C816F',
          '700': '#6E655A',
          '800': '#524C45',
          '900': '#38352F',
          '950': '#1F1D1A',
        },

        // ============================================
        // MATERIAL PALETTES
        // ============================================
        terracotta: {
          '50': '#FDF6F4',
          '100': '#FAEBE7',
          '200': '#F5D4CB',
          '300': '#EDB8A8',
          '400': '#E08E75',
          '500': '#D16A4B',
          '600': '#B85239',
          '700': '#96412E',
          '800': '#733325',
          '900': '#52251B',
          DEFAULT: '#D16A4B',
        },

        slate: {
          '50': '#F7F8F9',
          '100': '#EBEEF1',
          '200': '#D4DAE1',
          '300': '#B5C0CB',
          '400': '#8D9CAB',
          '500': '#6B7C8C',
          '600': '#556270',
          '700': '#444F59',
          '800': '#343C44',
          '900': '#242A30',
          DEFAULT: '#6B7C8C',
        },

        steel: {
          '50': '#F6F7F8',
          '100': '#E9ECEF',
          '200': '#D1D7DD',
          '300': '#AEB8C2',
          '400': '#8594A2',
          '500': '#667788',
          '600': '#535F6E',
          '700': '#434C57',
          '800': '#333941',
          '900': '#24282D',
          DEFAULT: '#667788',
        },

        concrete: {
          '50': '#FAFAFA',
          '100': '#F5F5F5',
          '200': '#E8E8E8',
          '300': '#D6D6D6',
          '400': '#B8B8B8',
          '500': '#939393',
          '600': '#6E6E6E',
          '700': '#545454',
          '800': '#3A3A3A',
          '900': '#262626',
          DEFAULT: '#939393',
        },

        wood: {
          '50': '#FAF7F5',
          '100': '#F2EBE5',
          '200': '#E4D5C8',
          '300': '#D1B9A3',
          '400': '#B89574',
          '500': '#9E7654',
          '600': '#825F42',
          '700': '#664A35',
          '800': '#4A3628',
          '900': '#32251C',
          DEFAULT: '#9E7654',
        },
      },

      // ============================================
      // KEYFRAME ANIMATIONS
      // ============================================
      keyframes: {
        // Fade animations
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },

        // Slide animations
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },

        // Scale animations
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },

        // Bounce
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },

        // Shake (for errors)
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },

        // Pulse animations
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'construction-pulse': {
          '0%': { boxShadow: '0 0 0 0 hsl(18 100% 60% / 0.4)' },
          '70%': { boxShadow: '0 0 0 12px hsl(18 100% 60% / 0)' },
          '100%': { boxShadow: '0 0 0 0 hsl(18 100% 60% / 0)' },
        },
        'success-pulse': {
          '0%': { boxShadow: '0 0 0 0 hsl(152 76% 36% / 0.4)' },
          '70%': { boxShadow: '0 0 0 12px hsl(152 76% 36% / 0)' },
          '100%': { boxShadow: '0 0 0 0 hsl(152 76% 36% / 0)' },
        },

        // Shimmer for skeletons
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },

        // Spin
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },

        // Float (subtle hover effect)
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },

        // Gradient animation
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },

        // Checkmark draw
        'checkmark': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },

        // Accordion
        'accordion-down': {
          '0%': { height: '0' },
          '100%': { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          '0%': { height: 'var(--radix-accordion-content-height)' },
          '100%': { height: '0' },
        },

        // Collapsible
        'collapsible-down': {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-collapsible-content-height)', opacity: '1' },
        },
        'collapsible-up': {
          '0%': { height: 'var(--radix-collapsible-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
      },

      // ============================================
      // ANIMATION CLASSES
      // ============================================
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fade-out': 'fade-out 150ms ease-in',
        'slide-up': 'slide-up 300ms ease-out',
        'slide-down': 'slide-down 300ms ease-out',
        'slide-left': 'slide-left 300ms ease-out',
        'slide-right': 'slide-right 300ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'scale-out': 'scale-out 150ms ease-in',
        'bounce-in': 'bounce-in 500ms ease-out',
        'shake': 'shake 400ms ease-in-out',
        'pulse-ring': 'pulse-ring 600ms ease-out',
        'construction-pulse': 'construction-pulse 600ms ease-out',
        'success-pulse': 'success-pulse 600ms ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'checkmark': 'checkmark 300ms ease-out forwards',
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 200ms ease-out',
        'collapsible-down': 'collapsible-down 200ms ease-out',
        'collapsible-up': 'collapsible-up 200ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
