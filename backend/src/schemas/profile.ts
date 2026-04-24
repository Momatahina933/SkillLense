import { z } from 'zod'

export const ProfileSchema = z.object({
  educationSummary: z.string().optional(),
  experienceSummary: z.string().optional(),
  targetRole: z.string().optional(),
  careerGoal: z.string().optional(),
})
