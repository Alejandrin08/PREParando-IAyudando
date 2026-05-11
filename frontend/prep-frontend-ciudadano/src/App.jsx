import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Resultados from './pages/Resultados'
import { useEffect } from 'react'
import { applyTheme } from './utils/theme'

export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem('theme') ?? 'light'
    applyTheme(saved)
  }, [])

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}