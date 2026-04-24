import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { validateBody } from '../middleware/validate'
import { ProfileSchema } from '../schemas/profile'
import * as profileController from '../controllers/profileController'

const router = Router()

router.get('/', requireAuth, profileController.get)
router.put('/', requireAuth, validateBody(ProfileSchema), profileController.update)

export default router
