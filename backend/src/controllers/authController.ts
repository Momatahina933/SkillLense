import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { name, email, password } = req.body

  try {
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const user = data.user
    const session = data.session

    // Supabase returns a user with empty identities array when email already exists
    if (!user || !session || (user.identities && user.identities.length === 0)) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const { rows } = await db.query(
      'INSERT INTO users (auth_id, name, email) VALUES ($1, $2, $3) RETURNING user_id, name, email, created_at',
      [user.id, name, email],
    )

    const newUser = rows[0]

    res.status(201).json({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: {
        userId: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { email, password } = req.body

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const { session } = data

    const { rows } = await db.query(
      'SELECT user_id, name, email, created_at FROM users WHERE auth_id = $1',
      [data.user.id],
    )

    const user = rows[0]

    res.status(200).json({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await supabase.auth.signOut()
    res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}
