import { Router, Request, Response, NextFunction } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { validateBody } from '../middleware/validate'
import { SkillReviewSchema } from '../schemas/cv'
import {
  upload,
  uploadCV,
  getCV,
  listCVs,
  deleteCV,
  reviewSkills,
} from '../controllers/cvController'

const router = Router()

// POST /api/cv/upload
router.post(
  '/upload',
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => {
      if (err) {
        if (err.message === 'INVALID_FILE_TYPE') {
          res.status(400).json({ error: 'Only PDF and DOCX files are accepted' })
          return
        }
        if ((err as any).code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ error: 'File exceeds 10 MB limit' })
          return
        }
        return next(err)
      }
      next()
    })
  },
  uploadCV,
)

// GET /api/cv/
router.get('/', requireAuth, listCVs)

// GET /api/cv/:id
router.get('/:id', requireAuth, getCV)

// DELETE /api/cv/:id
router.delete('/:id', requireAuth, deleteCV)

// PUT /api/cv/:id/skills/review
router.put('/:id/skills/review', requireAuth, validateBody(SkillReviewSchema), reviewSkills)

export default router
