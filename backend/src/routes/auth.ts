import { Router } from 'express'
import { validateBody } from '../middleware/validate'
import { requireAuth } from '../middleware/requireAuth'
import { RegisterSchema, LoginSchema } from '../schemas/auth'
import * as authController from '../controllers/authController'

const router = Router()

router.post('/register', validateBody(RegisterSchema), authController.register)
router.post('/login', validateBody(LoginSchema), authController.login)
router.post('/logout', requireAuth, authController.logout)

export default router
