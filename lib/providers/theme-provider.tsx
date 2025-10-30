'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Validates if a string is a valid theme value
 */
function isValidTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * Safely gets theme from localStorage with error handling
 */
function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme')
    if (isValidTheme(stored)) {
      return stored
    }
  } catch (error) {
    // localStorage unavailable (private mode, quota exceeded, etc.)
    console.warn('Failed to access localStorage:', error)
  }
  return 'system'
}

/**
 * Safely sets theme in localStorage with error handling
 */
function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem('theme', theme)
  } catch (error) {
    // localStorage unavailable - theme will still work but won't persist
    console.warn('Failed to save theme to localStorage:', error)
  }
}

/**
 * Applies theme to document root
 */
function applyTheme(theme: Theme): 'light' | 'dark' {
  const root = document.documentElement

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    root.classList.remove('light', 'dark')
    root.classList.add(systemTheme)
    return systemTheme
  } else {
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    return theme
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Get theme from localStorage with error handling
    const savedTheme = getStoredTheme()
    setTheme(savedTheme)

    // Apply theme immediately
    const resolved = applyTheme(savedTheme)
    setResolvedTheme(resolved)
  }, [])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        const resolved = applyTheme('system')
        setResolvedTheme(resolved)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme)
    setStoredTheme(newTheme)
    const resolved = applyTheme(newTheme)
    setResolvedTheme(resolved)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeValue }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context
 * Must be used within ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
