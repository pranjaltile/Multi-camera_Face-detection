import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import type { User } from './types/user'
import './App.css'

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for existing token and user data on app load
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch (err) {
        console.error('Failed to parse saved user data:', err)
        // If user data is invalid, clear everything
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleLogin = (newToken: string, userData: User) => {
    // Store both token and user data
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
    
    setToken(newToken)
    setUser(userData)
  }

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  // Add detailed debug logging
  console.log('App Render State:', {
    hasToken: !!token,
    tokenValue: token,
    hasUser: !!user,
    userData: user
  });

  return (
    <div className="App">
      <div style={{ padding: '20px' }}>
        {!token ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Dashboard token={token} user={user} onLogout={handleLogout} />
        )}
      </div>
    </div>
  )
}

export default App