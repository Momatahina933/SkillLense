import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../lib/db'

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  const client = await db.connect()
  try {
    const { userId } = req.user!
    const { title, companyName, descriptionText, requiredSkills } = req.body

    const jobId = uuidv4()

    await client.query('BEGIN')

    await client.query(
      `INSERT INTO job_descriptions (job_id, user_id, title, company_name, description_text)
       VALUES ($1, $2, $3, $4, $5)`,
      [jobId, userId, title, companyName ?? null, descriptionText],
    )

    for (const skill of requiredSkills) {
      await client.query(
        `INSERT INTO job_required_skills (job_skill_id, job_id, skill_name, importance_weight)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), jobId, skill.skillName, skill.importanceWeight],
      )
    }

    await client.query('COMMIT')

    const jobResult = await client.query(
      `SELECT job_id, user_id, title, company_name, description_text, created_at
       FROM job_descriptions WHERE job_id = $1`,
      [jobId],
    )

    const skillsResult = await client.query(
      `SELECT job_skill_id, job_id, skill_name, importance_weight
       FROM job_required_skills WHERE job_id = $1`,
      [jobId],
    )

    res.status(201).json({ ...jobResult.rows[0], requiredSkills: skillsResult.rows })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!
    const { id } = req.params

    const jobResult = await db.query(
      `SELECT job_id, user_id, title, company_name, description_text, created_at
       FROM job_descriptions WHERE job_id = $1 AND user_id = $2`,
      [id, userId],
    )

    if (jobResult.rowCount === 0) {
      res.status(404).json({ error: 'Job not found' })
      return
    }

    const skillsResult = await db.query(
      `SELECT job_skill_id, job_id, skill_name, importance_weight
       FROM job_required_skills WHERE job_id = $1`,
      [id],
    )

    res.json({ ...jobResult.rows[0], requiredSkills: skillsResult.rows })
  } catch (err) {
    next(err)
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!

    const jobsResult = await db.query(
      `SELECT job_id, user_id, title, company_name, description_text, created_at
       FROM job_descriptions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    )

    const jobs = await Promise.all(
      jobsResult.rows.map(async (job) => {
        const skillsResult = await db.query(
          `SELECT job_skill_id, job_id, skill_name, importance_weight
           FROM job_required_skills WHERE job_id = $1`,
          [job.job_id],
        )
        return { ...job, requiredSkills: skillsResult.rows }
      }),
    )

    res.json(jobs)
  } catch (err) {
    next(err)
  }
}

export async function deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!
    const { id } = req.params

    const result = await db.query(
      `DELETE FROM job_descriptions WHERE job_id = $1 AND user_id = $2`,
      [id, userId],
    )

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Job not found' })
      return
    }

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
