import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check for existing token on app load
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      // TODO: Validate token with backend
    }
  }, [])

  const handleLogin = (newToken: string, userData: any) => {
    setToken(newToken)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <div className="App">
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard token={token} user={user} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App