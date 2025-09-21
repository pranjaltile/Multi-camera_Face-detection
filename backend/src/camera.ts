import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from './middleware'

// Define custom context type
type Variables = {
  userId: string
}

const prisma = new PrismaClient()
const cameras = new Hono<{ Variables: Variables }>()

// Apply auth middleware to all routes
cameras.use('*', authMiddleware)

// Get all user's cameras
cameras.get('/', async (c) => {
  const userId = c.get('userId')
  
  const userCameras = await prisma.camera.findMany({
    where: { userId },
    include: { alerts: { take: 5, orderBy: { timestamp: 'desc' } } }
  })
  
  return c.json(userCameras)
})

// Create new camera
cameras.post('/', async (c) => {
  const userId = c.get('userId')
  const { name, rtspUrl, location } = await c.req.json()
  
  const camera = await prisma.camera.create({
    data: {
      name,
      rtspUrl,
      location,
      userId,
    },
  })
  
  return c.json(camera)
})

// Update camera
cameras.put('/:id', async (c) => {
  const userId = c.get('userId')
  const cameraId = c.req.param('id')
  const { name, rtspUrl, location, isEnabled } = await c.req.json()
  
  const camera = await prisma.camera.updateMany({
    where: { id: cameraId, userId },
    data: { name, rtspUrl, location, isEnabled },
  })
  
  return c.json(camera)
})

// Delete camera
cameras.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const cameraId = c.req.param('id')
  
  await prisma.camera.deleteMany({
    where: { id: cameraId, userId },
  })
  
  return c.json({ message: 'Camera deleted' })
})

export default cameras