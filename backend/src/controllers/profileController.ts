import { Response, NextFunction } from 'express'
import { Request } from 'express'
import { db } from '../lib/db'

function toProfile(row: Record<string, unknown>) {
  return {
    profileId: row.profile_id,
    userId: row.user_id,
    educationSummary: row.education_summary ?? null,
    experienceSummary: row.experience_summary ?? null,
    targetRole: row.target_role ?? null,
    careerGoal: row.career_goal ?? null,
  }
}

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { userId } = req.user!

  try {
    const { rows } = await db.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId],
    )

    if (rows.length > 0) {
      res.status(200).json(toProfile(rows[0]))
      return
    }

    // No profile yet — insert an empty one
    const { rows: inserted } = await db.query(
      'INSERT INTO profiles (user_id) VALUES ($1) RETURNING *',
      [userId],
    )

    res.status(200).json(toProfile(inserted[0]))
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { userId } = req.user!
  const { educationSummary, experienceSummary, targetRole, careerGoal } = req.body

  try {
    const { rows } = await db.query(
      `INSERT INTO profiles (user_id, education_summary, experience_summary, target_role, career_goal)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         education_summary  = EXCLUDED.education_summary,
         experience_summary = EXCLUDED.experience_summary,
         target_role        = EXCLUDED.target_role,
         career_goal        = EXCLUDED.career_goal,
         updated_at         = now()
       RETURNING *`,
      [userId, educationSummary ?? null, experienceSummary ?? null, targetRole ?? null, careerGoal ?? null],
    )

    res.status(200).json(toProfile(rows[0]))
  } catch (err) {
    next(err)
  }
}
