import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { validateBody } from '../middleware/validate'
import { FeedbackSchema } from '../schemas/feedback'
import { submit } from '../controllers/feedbackController'

const router = Router()

router.post('/', requireAuth, validateBody(FeedbackSchema), submit)

export default router
