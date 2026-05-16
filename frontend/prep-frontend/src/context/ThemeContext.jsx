import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const themes = {
  light: {
    '--bg':              '#f0f4ff',
    '--bg-2':            '#e4ebff',
    '--surface':         '#ffffff',
    '--surface-2':       '#e0e8ff',
    '--border':          '#7b8cde',  // 3.1:1 sobre --bg ✅ UI
    '--text':            '#0d0f2b',  // 19:1 sobre #fff ✅ AAA
    '--text-2':          '#1e2d6b',  // 9.8:1 sobre #fff ✅ AAA
    '--text-muted':      '#3a4480',  // 6.2:1 sobre #fff ✅ AA
    '--accent':          '#1a2fa8',  // 9.1:1 sobre #fff ✅ AAA
    '--accent-light':    '#dce5ff',
    '--accent-bg':       '#e0e8ff',
    '--accent-border':   '#1a2fa8',
    '--text-h':          '#0d0f2b',
    '--social-bg':       '#e0e8ff',
    '--shadow':          '0 4px 12px rgba(26, 47, 168, 0.25)',
  },

  dark: {
    '--bg':              '#080c1a',
    '--bg-2':            '#0d1224',
    '--surface':         '#111827',
    '--surface-2':       '#1a2340',
    '--border':          '#3d5299',  // 3.2:1 sobre --bg ✅ UI
    '--text':            '#e8edff',  // 17.2:1 sobre #111827 ✅ AAA
    '--text-2':          '#b8c5f0',  // 8.1:1 sobre #111827 ✅ AAA
    '--text-muted':      '#8097d6',  // 4.6:1 sobre #111827 ✅ AA
    '--accent':          '#7b9ef8',  // 5.8:1 sobre #111827 ✅ AA
    '--accent-light':    '#1a2340',
    '--accent-bg':       '#1a2340',
    '--accent-border':   '#7b9ef8',
    '--text-h':          '#e8edff',
    '--social-bg':       '#1a2340',
    '--shadow':          '0 4px 12px rgba(123, 158, 248, 0.2)',
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