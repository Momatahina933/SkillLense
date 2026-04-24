import { Request, Response, NextFunction } from 'express'

interface PostgresError extends Error {
  code?: string
}

export function errorHandler(
  err: PostgresError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err.code === '23505') {
    res.status(409).json({ error: 'A record with that value already exists.' })
    return
  }

  if (err.code === '23503') {
    res.status(400).json({ error: 'Referenced resource does not exist.' })
    return
  }

  res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' })
}
