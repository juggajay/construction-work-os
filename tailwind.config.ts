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
