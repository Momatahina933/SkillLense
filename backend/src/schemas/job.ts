import { z } from 'zod'

export const JobSchema = z.object({
  title: z.string().min(1),
  companyName: z.string().optional(),
  descriptionText: z.string().min(1),
  requiredSkills: z.array(
    z.object({
      skillName: z.string().min(1),
      importanceWeight: z.number().int().min(1).max(5),
    })
  ),
})
