import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0',
  					opacity: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)',
  					opacity: '1'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)',
  					opacity: '1'
  				},
  				to: {
  					height: '0',
  					opacity: '0'
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fade-in-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'scale-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.95)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
		'float': {
			'0%, 100%': {
				transform: 'translateY(0)'
			},
			'50%': {
				transform: 'translateY(-10px)'
			}
		},
		'slide-up': {
			'0%': {
				opacity: '0',
				transform: 'translateY(30px)'
			},
			'100%': {
				opacity: '1',
				transform: 'translateY(0)'
			}
		},
		'bounce': {
			'0%, 100%': {
				transform: 'translateY(0)'
			},
			'25%': {
				transform: 'translateY(-10px)'
			},
			'50%': {
				transform: 'translateY(0)'
			},
			'75%': {
				transform: 'translateY(-5px)'
			}
		},
		'shimmer': {
			'0%': {
				transform: 'translateX(-100%)'
			},
			'100%': {
				transform: 'translateX(100%)'
			}
		},
		'pulse-glow': {
			'0%, 100%': {
				opacity: '1',
				transform: 'scale(1)'
			},
			'50%': {
				opacity: '0.8',
				transform: 'scale(1.05)'
			}
		},
		'slide-in-left': {
			'0%': {
				opacity: '0',
				transform: 'translateX(-30px)'
			},
			'100%': {
				opacity: '1',
				transform: 'translateX(0)'
			}
		},
		'slide-in-right': {
			'0%': {
				opacity: '0',
				transform: 'translateX(30px)'
			},
			'100%': {
				opacity: '1',
				transform: 'translateX(0)'
			}
		},
		'blur-in': {
			'0%': {
				opacity: '0',
				filter: 'blur(12px)'
			},
			'100%': {
				opacity: '1',
				filter: 'blur(0)'
			}
		},
		'gradient-x': {
			'0%, 100%': {
				'background-position': '0% 50%'
			},
			'50%': {
				'background-position': '100% 50%'
			}
		},
		'float-slow': {
			'0%, 100%': {
				transform: 'translateY(0) rotate(0deg)'
			},
			'50%': {
				transform: 'translateY(-20px) rotate(3deg)'
			}
		},
		'spin-slow': {
			'0%': {
				transform: 'rotate(0deg)'
			},
			'100%': {
				transform: 'rotate(360deg)'
			}
		},
		'wiggle': {
			'0%, 100%': {
				transform: 'rotate(-3deg)'
			},
			'50%': {
				transform: 'rotate(3deg)'
			}
		}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'accordion-up': 'accordion-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		'fade-in': 'fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
		'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
		'scale-in': 'scale-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
		'float': 'float 3s ease-in-out infinite',
		'slide-up': 'slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
		'bounce': 'bounce 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
		'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
		'slide-in-left': 'slide-in-left 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
		'slide-in-right': 'slide-in-right 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
		'blur-in': 'blur-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
		'gradient-x': 'gradient-x 3s ease infinite',
		'float-slow': 'float-slow 6s ease-in-out infinite',
		'spin-slow': 'spin-slow 20s linear infinite',
		'wiggle': 'wiggle 1s ease-in-out infinite'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'SF Pro Display',
  				'SF Pro Text',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'xs': ['0.75rem', { lineHeight: '1rem' }],
  			'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  			'base': ['1rem', { lineHeight: '1.5rem' }],
  			'lg': ['1.125rem', { lineHeight: '1.75rem' }],
  			'xl': ['1.25rem', { lineHeight: '1.75rem' }],
  			'2xl': ['1.5rem', { lineHeight: '2rem' }],
  			'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  			'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  			'5xl': ['3rem', { lineHeight: '1.16' }],
  			'6xl': ['3.75rem', { lineHeight: '1.16' }],
  			'7xl': ['4.5rem', { lineHeight: '1.16' }],
  			'8xl': ['6rem', { lineHeight: '1.16' }],
  			'9xl': ['8rem', { lineHeight: '1.16' }]
  		},
  		letterSpacing: {
  			'tighter': '-0.05em',
  			'tight': '-0.025em',
  			'normal': '0',
  			'wide': '0.025em',
  			'wider': '0.05em',
  			'widest': '0.1em'
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
