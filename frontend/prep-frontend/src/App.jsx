import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import Dashboard from './components/dashboard/Dashboard'
import ActaQueue from './components/capturista/ActaQueue'
import ActaDetail from './components/capturista/ActaDetail'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/queue" element={<ActaQueue />} />
          <Route path="/actas/:id" element={<ActaDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}