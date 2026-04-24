import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../lib/db'

export async function submit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!
    const { matchId, usabilityRating, comments } = req.body as {
      matchId: string
      usabilityRating: number
      comments?: string
    }

    const feedbackId = uuidv4()

    const result = await db.query(
      `INSERT INTO feedback (feedback_id, match_id, user_id, usability_rating, comments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING feedback_id, match_id, usability_rating, comments, created_at`,
      [feedbackId, matchId, userId, usabilityRating, comments ?? null],
    )

    const row = result.rows[0]
    res.status(201).json({
      feedbackId: row.feedback_id,
      matchId: row.match_id,
      usabilityRating: row.usability_rating,
      comments: row.comments,
      createdAt: row.created_at,
    })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Feedback already submitted for this match' })
      return
    }
    next(err)
  }
}
