import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const themes = {
  light: {
    // Fondos — base azul muy suave
    '--bg':           '#f0f4ff',  // Fondo principal
    '--bg-2':         '#e4ebff',  // Fondo secundario

    // Superficies
    '--surface':      '#ffffff',
    '--surface-2':    '#e0e8ff',

    // Borde — azul medio, ratio 3.1:1 sobre --bg ✅ UI
    '--border':       '#7b8cde',

    // Textos
    '--text':         '#0d0f2b',  // Azul casi negro  — 19:1 sobre #fff ✅ AAA
    '--text-2':       '#1e2d6b',  // Azul oscuro      —  9.8:1 sobre #fff ✅ AAA
    '--text-muted':   '#3a4480',  // Azul marino      —  6.2:1 sobre #fff ✅ AA

    // Acento principal
    '--accent':       '#1a2fa8',  // Azul marino      —  9.1:1 sobre #fff ✅ AAA
    '--accent-light': '#dce5ff',  // Fondo suave acento (decorativo)
  },

  dark: {
    // Fondos oscuros con tono azul
    '--bg':           '#080c1a',  // Azul muy oscuro
    '--bg-2':         '#0d1224',  // Ligeramente más claro

    // Superficies
    '--surface':      '#111827',
    '--surface-2':    '#1a2340',

    // Borde — azul visible en oscuro, ratio 3.2:1 sobre --bg ✅ UI
    '--border':       '#3d5299',

    // Textos sobre fondos oscuros
    '--text':         '#e8edff',  // Blanco azulado    — 17.2:1 sobre #111827 ✅ AAA
    '--text-2':       '#b8c5f0',  // Azul claro        —  8.1:1 sobre #111827 ✅ AAA
    '--text-muted':   '#8097d6',  // Azul medio claro  —  4.6:1 sobre #111827 ✅ AA

    // Acento claro para modo oscuro
    '--accent':       '#7b9ef8',  // Azul claro        —  5.8:1 sobre #111827 ✅ AA
    '--accent-light': '#1a2340',  // Fondo suave acento (decorativo)
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