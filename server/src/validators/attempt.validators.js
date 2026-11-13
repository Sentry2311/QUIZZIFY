import { z } from 'zod';

export const submitAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid question id'),
        selectedIndex: z.coerce.number().int().min(0).nullable(),
        timeMs: z.coerce.number().int().min(0).max(600000).optional().default(0),
      }),
    )
    .min(1, 'Submit at least one answer'),
  durationMs: z.coerce.number().int().min(0).max(3600000).optional().default(0),
});
