import { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../lib/db'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

// ── run ──────────────────────────────────────────────────────────────────────

export async function run(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!
    const { cvId, jobId } = req.body as { cvId: string; jobId: string }

    // Verify CV belongs to user
    const cvResult = await db.query(
      `SELECT cv_id, parse_status FROM cv_uploads WHERE cv_id = $1 AND user_id = $2`,
      [cvId, userId],
    )
    if (cvResult.rowCount === 0) {
      res.status(404).json({ error: 'CV not found' })
      return
    }

    // Verify job belongs to user
    const jobResult = await db.query(
      `SELECT job_id FROM job_descriptions WHERE job_id = $1 AND user_id = $2`,
      [jobId, userId],
    )
    if (jobResult.rowCount === 0) {
      res.status(404).json({ error: 'Job not found' })
      return
    }

    // Check CV parse status
    if (cvResult.rows[0].parse_status !== 'completed') {
      res.status(409).json({ error: 'CV parsing not complete' })
      return
    }

    // Check for existing in-progress match
    const inProgressResult = await db.query(
      `SELECT match_id FROM match_results
       WHERE cv_id = $1 AND job_id = $2 AND user_id = $3
         AND match_score IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [cvId, jobId, userId],
    )
    if ((inProgressResult.rowCount ?? 0) > 0) {
      res.status(202).json({ matchId: inProgressResult.rows[0].match_id })
      return
    }

    // Fetch extracted skills (user_verified OR confidence >= 0.7)
    const skillsResult = await db.query(
      `SELECT normalised_name, confidence_score, user_verified
       FROM extracted_skills
       WHERE cv_id = $1 AND (user_verified = true OR confidence_score >= 0.7)`,
      [cvId],
    )
    const cvSkills = skillsResult.rows.map((r: { normalised_name: string }) => ({
      normalised_name: r.normalised_name,
    }))

    // Fetch job required skills
    const jobSkillsResult = await db.query(
      `SELECT skill_name, importance_weight
       FROM job_required_skills
       WHERE job_id = $1`,
      [jobId],
    )
    const jobSkills = jobSkillsResult.rows

    // Call Python matching service
    let matchResponse: {
      match_score: number
      explanation: string
      matched: Array<{ skill: string; score: number; type: string }>
      partial: Array<{ skill: string; score: number; type: string }>
      missing: Array<{ skill: string; score: number; type: string }>
    }

    try {
      const { data } = await axios.post(`${PYTHON_SERVICE_URL}/match`, {
        cv_skills: cvSkills,
        job_skills: jobSkills,
      })
      matchResponse = data
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        res.status(503).json({
          error: 'AI service temporarily unavailable',
          retryAfter: 30,
        })
        return
      }
      throw err
    }

    // Insert match_results row
    const matchId = uuidv4()
    await db.query(
      `INSERT INTO match_results (match_id, user_id, cv_id, job_id, match_score, explanation)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [matchId, userId, cvId, jobId, matchResponse.match_score, matchResponse.explanation],
    )

    // Insert skill_gap_results rows
    const allSkills = [
      ...matchResponse.matched,
      ...matchResponse.partial,
      ...matchResponse.missing,
    ]
    for (const skill of allSkills) {
      await db.query(
        `INSERT INTO skill_gap_results (gap_id, match_id, skill_name, gap_type, similarity_score)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), matchId, skill.skill, skill.type, skill.score],
      )
    }

    // Fetch and return full MatchResult
    const matchRow = await db.query(
      `SELECT match_id, user_id, cv_id, job_id, match_score, explanation, created_at
       FROM match_results WHERE match_id = $1`,
      [matchId],
    )
    const gapsRows = await db.query(
      `SELECT gap_id, match_id, skill_name, gap_type, similarity_score, recommendation_note
       FROM skill_gap_results WHERE match_id = $1`,
      [matchId],
    )

    res.status(200).json({
      ...matchRow.rows[0],
      skillGaps: gapsRows.rows,
    })
  } catch (err) {
    next(err)
  }
}

// ── getMatch ─────────────────────────────────────────────────────────────────

export async function getMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!
    const { id } = req.params

    const matchRow = await db.query(
      `SELECT match_id, user_id, cv_id, job_id, match_score, explanation, created_at
       FROM match_results WHERE match_id = $1 AND user_id = $2`,
      [id, userId],
    )

    if (matchRow.rowCount === 0) {
      res.status(404).json({ error: 'Match not found' })
      return
    }

    const gapsRows = await db.query(
      `SELECT gap_id, match_id, skill_name, gap_type, similarity_score, recommendation_note
       FROM skill_gap_results WHERE match_id = $1`,
      [id],
    )

    res.json({
      ...matchRow.rows[0],
      skillGaps: gapsRows.rows,
    })
  } catch (err) {
    next(err)
  }
}

// ── history ──────────────────────────────────────────────────────────────────

export async function history(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!

    const result = await db.query(
      `SELECT match_id, user_id, cv_id, job_id, match_score, explanation, created_at
       FROM match_results
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    )

    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}
