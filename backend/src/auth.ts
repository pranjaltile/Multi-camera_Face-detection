import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const auth = new Hono()

// Register endpoint
auth.post('/register', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    })

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return c.json({ token, user: { id: user.id, username: user.username } })
  } catch (error) {
    return c.json({ error: 'Registration failed' }, 400)
  }
})

// Login endpoint
auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return c.json({ token, user: { id: user.id, username: user.username } })
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

export default auth