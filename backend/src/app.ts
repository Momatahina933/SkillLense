import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import authRouter from './routes/auth'
import profileRouter from './routes/profile'
import cvRouter from './routes/cv'
import jobsRouter from './routes/jobs'
import matchRouter from './routes/match'
import feedbackRouter from './routes/feedback'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// Security headers
app.use(helmet())

// CORS — restricted to frontend origin
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
}))

// Body parsing
app.use(express.json())

// Rate limiter for auth routes: 100 req / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiter for all other routes: 500 req / 15 min
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth', authLimiter)
app.use('/api', generalLimiter)

// Routes
app.use('/api/auth', authRouter)
app.use('/api/profile', profileRouter)
app.use('/api/cv', cvRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/match', matchRouter)
app.use('/api/feedback', feedbackRouter)

// Error handler (must be last)
app.use(errorHandler)

export default app
