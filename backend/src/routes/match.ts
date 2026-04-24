import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { validateBody } from '../middleware/validate'
import { MatchRunSchema } from '../schemas/match'
import { run, history, getMatch } from '../controllers/matchController'

const router = Router()

router.post('/run', requireAuth, validateBody(MatchRunSchema), run)
router.get('/history', requireAuth, history)  // must come before /:id
router.get('/:id', requireAuth, getMatch)

export default router
