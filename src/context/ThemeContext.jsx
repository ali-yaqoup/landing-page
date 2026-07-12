import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('stockflow-theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('stockflow-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        dark: theme === 'dark',
        theme,
        toggle: () => setThemeState((current) => (current === 'dark' ? 'light' : 'dark')),
        setTheme: (value) => setThemeState(value === 'dark' ? 'dark' : 'light'),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
