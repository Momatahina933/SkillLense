import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { validateBody } from '../middleware/validate'
import { JobSchema } from '../schemas/job'
import { create, get, list, deleteJob } from '../controllers/jobController'

const router = Router()

router.post('/', requireAuth, validateBody(JobSchema), create)
router.get('/', requireAuth, list)
router.get('/:id', requireAuth, get)
router.delete('/:id', requireAuth, deleteJob)

export default router
