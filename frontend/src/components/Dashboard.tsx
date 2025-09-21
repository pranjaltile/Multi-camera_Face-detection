import React, { useState, useEffect } from 'react'
import './Dashboard.css'

interface Camera {
  id: string
  name: string
  rtspUrl: string
  location: string
  isEnabled: boolean
  alerts: Alert[]
}

interface Alert {
  id: string
  timestamp: string
  imageUrl?: string
  confidence?: number
}

interface DashboardProps {
  token: string
  user: any
  onLogout: () => void
}

export default function Dashboard({ token, user, onLogout }: DashboardProps) {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [showAddCamera, setShowAddCamera] = useState(false)
  const [newCamera, setNewCamera] = useState({
    name: '',
    rtspUrl: '',
    location: ''
  })

  useEffect(() => {
    fetchCameras()
  }, [])

  const fetchCameras = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/cameras', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCameras(data)
      }
    } catch (error) {
      console.error('Failed to fetch cameras:', error)
    }
  }

  const addCamera = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:3001/api/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCamera)
      })
      
      if (response.ok) {
        setNewCamera({ name: '', rtspUrl: '', location: '' })
        setShowAddCamera(false)
        fetchCameras()
      }
    } catch (error) {
      console.error('Failed to add camera:', error)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>🎯 Skylark Dashboard</h1>
          <p>Welcome, {user.username}!</p>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <div className="cameras-section">
          <div className="section-header">
            <h2>📹 Camera Feeds ({cameras.length})</h2>
            <button 
              onClick={() => setShowAddCamera(true)}
              className="add-btn"
            >
              + Add Camera
            </button>
          </div>

          {showAddCamera && (
            <div className="modal">
              <div className="modal-content">
                <h3>Add New Camera</h3>
                <form onSubmit={addCamera}>
                  <input
                    type="text"
                    placeholder="Camera Name"
                    value={newCamera.name}
                    onChange={(e) => setNewCamera({...newCamera, name: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="RTSP URL"
                    value={newCamera.rtspUrl}
                    onChange={(e) => setNewCamera({...newCamera, rtspUrl: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={newCamera.location}
                    onChange={(e) => setNewCamera({...newCamera, location: e.target.value})}
                  />
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowAddCamera(false)}>
                      Cancel
                    </button>
                    <button type="submit">Add Camera</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="cameras-grid">
            {cameras.length === 0 ? (
              <div className="empty-state">
                <p>🎥 No cameras added yet</p>
                <p>Click "Add Camera" to get started!</p>
              </div>
            ) : (
              cameras.map(camera => (
                <div key={camera.id} className="camera-card">
                  <div className="camera-header">
                    <h3>{camera.name}</h3>
                    <span className={`status ${camera.isEnabled ? 'online' : 'offline'}`}>
                      {camera.isEnabled ? '🟢 Online' : '🔴 Offline'}
                    </span>
                  </div>
                  <div className="camera-video">
                    <div className="video-placeholder">
                      📹 Video Feed
                      <br />
                      <small>WebRTC Coming Soon...</small>
                    </div>
                  </div>
                  <div className="camera-info">
                    <p>📍 {camera.location || 'No location'}</p>
                    <p>🚨 {camera.alerts.length} recent alerts</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}