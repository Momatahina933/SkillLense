import { z } from 'zod'

export const FeedbackSchema = z.object({
  matchId: z.string().uuid(),
  usabilityRating: z.number().int().min(1).max(5),
  comments: z.string().optional(),
})
