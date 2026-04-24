import { z } from 'zod'

export const SkillReviewSchema = z.object({
  updates: z.array(
    z.object({
      skillId: z.string().uuid(),
      userVerified: z.boolean(),
    })
  ),
})
