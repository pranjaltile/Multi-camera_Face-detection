import React, { useState, useEffect } from 'react'
import './Dashboard.css'
import VideoFeed from './VideoFeed'

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

import type { User } from '../types/user'

interface DashboardProps {
  token: string
  user: User | null
  onLogout: () => void
}

export default function Dashboard({ token, user, onLogout }: DashboardProps) {
  if (!user) {
    return null; // or return a loading state or redirect to login
  }
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

  const handleDeleteCamera = async (cameraId: string) => {
    if (!window.confirm('Are you sure you want to delete this camera?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/cameras/${cameraId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove camera from local state
        setCameras(cameras.filter(cam => cam.id !== cameraId));
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete camera');
      }
    } catch (error) {
      console.error('Failed to delete camera:', error);
      alert('Failed to delete camera. Please try again.');
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="app-name">Real-Time Multi-Camera Face Detection Dashboard</div>
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
                    <div className="camera-header-main">
                      <h3>{camera.name}</h3>
                      <span className={`status ${camera.isEnabled ? 'online' : 'offline'}`}>
                        {camera.isEnabled ? '🟢 Online' : '🔴 Offline'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteCamera(camera.id)}
                      className="delete-btn"
                      title="Delete Camera"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="camera-video">
                    <VideoFeed
                      cameraId={camera.id}
                      cameraName={camera.name}
                      rtspUrl={camera.rtspUrl}
                    />
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