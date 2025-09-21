import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { PrismaClient } from '@prisma/client'
import auth from './auth'
import cameras from './camera'
import { corsMiddleware } from './middleware'

const prisma = new PrismaClient()

const app = new Hono()

// Apply CORS middleware globally
app.use('*', corsMiddleware)

// Health check
app.get('/', (c) => c.json({ message: 'Skylark API is running! 🚀' }))

// Routes
app.route('/api/auth', auth)
app.route('/api/cameras', cameras)

// Alerts endpoint (for worker to post alerts)
app.post('/api/alerts', async (c) => {
  try {
    const { cameraId, imageUrl, confidence } = await c.req.json()
    
    // Save alert to database
    const alert = await prisma.alert.create({
      data: {
        cameraId,
        imageUrl,
        confidence,
      },
    })
    
    // TODO: Emit to WebSocket for real-time updates
    
    return c.json(alert)
  } catch (error) {
    return c.json({ error: 'Failed to create alert' }, 500)
  }
})

const port = 3001
console.log(`🚀 Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})