import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { db } from '../lib/db'
import { supabase } from '../lib/supabase'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

// ── Multer config ────────────────────────────────────────────────────────────

const fileFilter: multer.Options['fileFilter'] = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('INVALID_FILE_TYPE') as unknown as null, false)
  }
}

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file')

// ── Helper ───────────────────────────────────────────────────────────────────

export function getFileType(mimetype: string): 'pdf' | 'docx' {
  if (mimetype === 'application/pdf') return 'pdf'
  return 'docx'
}

// ── Controllers ──────────────────────────────────────────────────────────────

export async function uploadCV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const { userId } = req.user!

    // Sanitise filename: strip path separators and null bytes
    const sanitisedName = req.file.originalname
      .replace(/[/\\]/g, '_')
      .replace(/\0/g, '')

    const cvId = uuidv4()
    const storagePath = `${userId}/${cvId}/${sanitisedName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype })

    if (uploadError) {
      return next(uploadError)
    }

    // Create signed URL (1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('cvs')
      .createSignedUrl(storagePath, 3600)

    if (signedError || !signedData?.signedUrl) {
      return next(signedError ?? new Error('Failed to create signed URL'))
    }

    // Insert cv_uploads row
    await db.query(
      `INSERT INTO cv_uploads (cv_id, user_id, file_name, file_path, parse_status)
       VALUES ($1, $2, $3, $4, 'processing')`,
      [cvId, userId, sanitisedName, storagePath],
    )

    // Fire-and-forget to Python service
    const fileType = getFileType(req.file.mimetype)
    axios
      .post(`${PYTHON_SERVICE_URL}/parse`, {
        cv_id: cvId,
        file_url: signedData.signedUrl,
        file_type: fileType,
      })
      .catch(() => {
        // Best-effort; Python service updates status independently
      })

    res.status(202).json({ cvId, status: 'processing' })
  } catch (err) {
    next(err)
  }
}

export async function getCV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!
    const { id } = req.params

    const cvResult = await db.query(
      `SELECT cv_id, user_id, file_name, file_path, upload_date, parse_status, error_message
       FROM cv_uploads
       WHERE cv_id = $1 AND user_id = $2`,
      [id, userId],
    )

    if (cvResult.rowCount === 0) {
      res.status(404).json({ error: 'CV not found' })
      return
    }

    const skillsResult = await db.query(
      `SELECT skill_id, cv_id, raw_skill_text, normalised_name, confidence_score, user_verified, created_at
       FROM extracted_skills
       WHERE cv_id = $1`,
      [id],
    )

    res.json({ ...cvResult.rows[0], extractedSkills: skillsResult.rows })
  } catch (err) {
    next(err)
  }
}

export async function listCVs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!

    const result = await db.query(
      `SELECT cv_id, user_id, file_name, file_path, upload_date, parse_status, error_message
       FROM cv_uploads
       WHERE user_id = $1
       ORDER BY upload_date DESC`,
      [userId],
    )

    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function deleteCV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!
    const { id } = req.params

    const cvResult = await db.query(
      `SELECT file_path FROM cv_uploads WHERE cv_id = $1 AND user_id = $2`,
      [id, userId],
    )

    if (cvResult.rowCount === 0) {
      res.status(404).json({ error: 'CV not found' })
      return
    }

    const { file_path } = cvResult.rows[0]

    // Delete from Supabase Storage
    await supabase.storage.from('cvs').remove([file_path])

    // Delete DB row (cascades to extracted_skills)
    await db.query(`DELETE FROM cv_uploads WHERE cv_id = $1 AND user_id = $2`, [id, userId])

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function reviewSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!
    const { id } = req.params
    const { updates } = req.body as { updates: { skillId: string; userVerified: boolean }[] }

    // Verify CV belongs to user
    const cvResult = await db.query(
      `SELECT cv_id FROM cv_uploads WHERE cv_id = $1 AND user_id = $2`,
      [id, userId],
    )

    if (cvResult.rowCount === 0) {
      res.status(404).json({ error: 'CV not found' })
      return
    }

    // Update each skill
    for (const { skillId, userVerified } of updates) {
      await db.query(
        `UPDATE extracted_skills SET user_verified = $1 WHERE skill_id = $2 AND cv_id = $3`,
        [userVerified, skillId, id],
      )
    }

    res.status(200).json({ updated: updates.length })
  } catch (err) {
    next(err)
  }
}
