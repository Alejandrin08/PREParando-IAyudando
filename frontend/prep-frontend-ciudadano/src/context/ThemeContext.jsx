import { createContext, useContext, useEffect, useState } from 'react'
import { applyTheme } from '../utils/theme'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') ?? 'light')
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('fontSize') ?? '16'))

  useEffect(() => {
    applyTheme(mode)
    localStorage.setItem('theme', mode)
  }, [mode])

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
    localStorage.setItem('fontSize', fontSize)
  }, [fontSize])

  const toggleTheme = () => setMode(m => m === 'light' ? 'dark' : 'light')
  const increaseFontSize = () => setFontSize(s => Math.min(s + 2, 22))
  const decreaseFontSize = () => setFontSize(s => Math.max(s - 2, 12))

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, fontSize, increaseFontSize, decreaseFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)