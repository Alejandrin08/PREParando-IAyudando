import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import Dashboard from './components/dashboard/Dashboard'
import ActaQueue from './components/capturista/ActaQueue'
import ActaDetail from './components/capturista/ActaDetail'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/queue" element={<ActaQueue />} />
            <Route path="/actas/:id" element={<ActaDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}