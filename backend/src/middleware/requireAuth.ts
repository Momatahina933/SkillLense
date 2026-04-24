import { Request, Response, NextFunction } from 'express'
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization']

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' })
    return
  }

  const token = header.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload
    req.user = { userId: payload.sub as string, email: payload.email as string }
    next()
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' })
    } else if (err instanceof JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' })
    } else {
      res.status(401).json({ error: 'Invalid token' })
    }
  }
}
