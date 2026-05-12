import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decoded = jwtDecode(token)
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            token,
            email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
            fullName: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
            role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
          })
        } else {
          localStorage.removeItem('token')
        }
      } catch {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = (data) => {
    localStorage.setItem('token', data.token)
    setUser({
      token: data.token,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    })
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