import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext()

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
const NAME_CLAIM  = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'

function decodeUser(token) {
  try {
    const decoded = jwtDecode(token)
    if (decoded.exp * 1000 <= Date.now()) return null
    return {
      token,
      email:    decoded[EMAIL_CLAIM],
      fullName: decoded[NAME_CLAIM],
      role:     decoded[ROLE_CLAIM],
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = decodeUser(token)
      if (decoded) {
        setUser(decoded)
      } else {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = ({ token }) => {
    localStorage.setItem('token', token)
    const decoded = decodeUser(token)
    setUser(decoded)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)