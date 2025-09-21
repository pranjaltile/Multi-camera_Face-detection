import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authorization = c.req.header('Authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401)
    }

    const token = authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Add user info to context
    c.set('userId', decoded.userId)
    c.set('username', decoded.username)
    
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

export const corsMiddleware = async (c: Context, next: Next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (c.req.method === 'OPTIONS') {
    return c.text('OK')
  }
  
  await next()
}