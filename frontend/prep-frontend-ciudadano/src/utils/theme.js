export const themes = {
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

export function applyTheme(mode) {
  const vars = themes[mode]
  const root = document.documentElement
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val))
  root.classList.toggle('dark', mode === 'dark')
}