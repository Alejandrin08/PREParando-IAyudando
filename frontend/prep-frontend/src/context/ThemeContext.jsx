import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const themes = {
  light: {
    '--bg': '#faf9f6',
    '--bg-2': '#f2f0eb',
    '--surface': '#ffffff',
    '--surface-2': '#f5f3ef',
    '--border': '#e8e4dc',
    '--text': '#1c1917',
    '--text-2': '#44403c',
    '--text-muted': '#78716c',
    '--accent': '#c2410c',
    '--accent-light': '#fff7ed',
  },
  dark: {
    '--bg': '#141210',
    '--bg-2': '#1c1917',
    '--surface': '#211e1b',
    '--surface-2': '#292421',
    '--border': '#3a3330',
    '--text': '#f5f0eb',
    '--text-2': '#d4cdc6',
    '--text-muted': '#8a7f78',
    '--accent': '#ea580c',
    '--accent-light': '#2a1a10',
  }
}

function applyTheme(mode) {
  const vars = themes[mode]
  Object.entries(vars).forEach(([key, val]) =>
    document.documentElement.style.setProperty(key, val)
  )
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') ?? 'light')
  const [fontSize, setFontSize] = useState(() =>
    parseInt(localStorage.getItem('fontSize') ?? '16')
  )

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
    <ThemeContext.Provider value={{
      mode,
      toggleTheme,
      fontSize,
      increaseFontSize,
      decreaseFontSize
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
export { applyTheme }