import { z } from 'zod'

export const MatchRunSchema = z.object({
  cvId: z.string().uuid(),
  jobId: z.string().uuid(),
})
