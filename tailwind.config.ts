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
  		// Touch-friendly target sizes (WCAG 2.1 minimum 44px)
  		minHeight: {
  			'touch': '44px',
  			'touch-lg': '48px',
  			'touch-xl': '56px',
  		},
  		minWidth: {
  			'touch': '44px',
  			'touch-lg': '48px',
  			'touch-xl': '56px',
  		},
  		height: {
  			'touch': '44px',
  			'touch-lg': '48px',
  			'touch-xl': '56px',
  		},
  		// Typography scale with optimal line heights
  		fontSize: {
  			'display-xl': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
  			'display-lg': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
  			'display': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
  			'heading-lg': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }],
  			'heading': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
  			'heading-sm': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
  			'body-lg': ['1.125rem', { lineHeight: '1.6' }],
  			'body': ['1rem', { lineHeight: '1.6' }],
  			'body-sm': ['0.875rem', { lineHeight: '1.5' }],
  			'caption': ['0.75rem', { lineHeight: '1.4' }],
  			'tiny': ['0.625rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		backdropBlur: {
  			glass: '12px',
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-construction': 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
  			'gradient-success': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  			'gradient-warning': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  			'gradient-danger': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  		},
  		boxShadow: {
  			'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  			'elevation-2': '0 2px 4px 0 rgb(0 0 0 / 0.05), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
  			'elevation-3': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
  			'elevation-4': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
  			'elevation-5': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
  			'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  			// Dark mode glow effects
  			'glow-construction': '0 0 20px rgba(255, 107, 53, 0.3)',
  			'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
  			'glow-warning': '0 0 20px rgba(245, 158, 11, 0.3)',
  			'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3)',
  			// Dark mode depth shadows
  			'dark-elevation-1': '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
  			'dark-elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
  			'dark-elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
  		},
  		// Animation timing functions
  		transitionTimingFunction: {
  			'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  			'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
  			'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
  			'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  		},
  		// Animation durations
  		transitionDuration: {
  			'fast': '150ms',
  			'normal': '200ms',
  			'slow': '300ms',
  			'slower': '500ms',
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			'construction-orange': '#FF6B35',
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			danger: {
  				DEFAULT: 'hsl(var(--danger))',
  				foreground: 'hsl(var(--danger-foreground))'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))'
  			},
  			construction: {
  				'50': '#FFF5F1',
  				'100': '#FFE8DE',
  				'200': '#FFCCBD',
  				'300': '#FFB09C',
  				'400': '#FF8B6B',
  				'500': '#FF6B35',
  				'600': '#F7931E',
  				'700': '#DB6B00',
  				'800': '#B85700',
  				'900': '#8A4200',
  			},
  			steel: {
  				'50': '#F5F6F7',
  				'100': '#E8EAED',
  				'200': '#D1D5DA',
  				'300': '#A8B0BA',
  				'400': '#7D8794',
  				'500': '#5D6875',
  				'600': '#4A5461',
  				'700': '#3D444F',
  				'800': '#2F3640',
  				'900': '#1F2329',
  			},
  			concrete: {
  				'50': '#FAFAFA',
  				'100': '#F4F4F5',
  				'200': '#E4E4E7',
  				'300': '#D4D4D8',
  				'400': '#A1A1AA',
  				'500': '#71717A',
  				'600': '#52525B',
  				'700': '#3F3F46',
  				'800': '#27272A',
  				'900': '#18181B',
  			},
  		},
  		animation: {
  			'gradient': 'gradient 8s linear infinite',
  		},
  		keyframes: {
  			gradient: {
  				'0%, 100%': {
  					'background-size': '200% 200%',
  					'background-position': 'left center',
  				},
  				'50%': {
  					'background-size': '200% 200%',
  					'background-position': 'right center',
  				},
  			},
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
