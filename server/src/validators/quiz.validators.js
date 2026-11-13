import { z } from 'zod';

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(3, 'Question text is too short').max(400),
  options: z
    .array(z.string().trim().min(1, 'Options cannot be empty').max(160))
    .min(2, 'Add at least 2 options')
    .max(6, 'At most 6 options'),
  correctIndex: z.coerce.number().int().min(0, 'Pick a correct answer'),
  explanation: z.string().trim().max(400).optional().default(''),
  points: z.coerce.number().int().min(1).max(100).optional().default(10),
  timeLimitSeconds: z.coerce.number().int().min(5).max(120).optional().default(20),
});

const quizBase = {
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().max(600).optional().default(''),
  category: z.string().trim().min(2, 'Category is required').max(40),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  cover: z.string().trim().max(8).optional().default('🧠'),
  timeLimitSeconds: z.coerce.number().int().min(5).max(120).optional().default(20),
  isPublished: z.boolean().optional().default(true),
  questions: z.array(questionSchema).min(1, 'Add at least one question').max(50, 'At most 50 questions'),
};

export const createQuizSchema = z.object(quizBase).superRefine((quiz, ctx) => {
  quiz.questions.forEach((question, index) => {
    if (question.correctIndex >= question.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['questions', index, 'correctIndex'],
        message: 'Correct answer must be one of the options',
      });
    }
  });
});

export const updateQuizSchema = z
  .object({
    title: quizBase.title.optional(),
    description: quizBase.description,
    category: quizBase.category.optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    cover: quizBase.cover,
    timeLimitSeconds: quizBase.timeLimitSeconds,
    isPublished: z.boolean().optional(),
    questions: quizBase.questions.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

export const listQuizzesSchema = z.object({
  search: z.string().trim().max(80).optional().default(''),
  category: z.string().trim().max(40).optional().default('all'),
  difficulty: z.enum(['all', 'easy', 'medium', 'hard']).optional().default('all'),
  sort: z.enum(['newest', 'popular', 'az']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(9),
});
