import { Quiz } from '../models/Quiz.js';
import { Attempt } from '../models/Attempt.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { notify } from '../services/notify.js';

/** POST /api/quizzes/:id/attempts - score answers server-side */
export const submitAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw ApiError.notFound('Quiz not found');
  if (!quiz.isPublished) throw ApiError.badRequest('This quiz is not published yet');

  const submitted = new Map(req.body.answers.map((answer) => [answer.questionId, answer]));

  const answers = quiz.questions.map((question) => {
    const answer = submitted.get(question.id);
    const selectedIndex = answer?.selectedIndex ?? null;
    return {
      questionId: question._id,
      selectedIndex,
      isCorrect: selectedIndex === question.correctIndex,
      timeMs: answer?.timeMs ?? 0,
    };
  });

  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const totalQuestions = quiz.questions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const score = quiz.questions.reduce(
    (sum, question, index) => sum + (answers[index].isCorrect ? question.points || 10 : 0),
    0,
  );

  const attempt = await Attempt.create({
    user: req.user._id,
    quiz: quiz._id,
    answers,
    correctCount,
    totalQuestions,
    score,
    percentage,
    durationMs: req.body.durationMs ?? 0,
  });

  quiz.plays += 1;
  await quiz.save();

  const io = req.app.get('io');
  if (percentage >= 80) {
    await notify(io, req.user._id, {
      type: 'achievement',
      title: percentage === 100 ? 'Perfect score!' : 'Great result!',
      message: `You scored ${percentage}% on "${quiz.title}".`,
      link: '/dashboard',
    });
  }

  res.status(201).json({
    success: true,
    message: 'Attempt submitted',
    data: {
      attempt: {
        id: attempt.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        correctCount,
        totalQuestions,
        score,
        percentage,
        durationMs: attempt.durationMs,
        createdAt: attempt.createdAt,
      },
      review: quiz.questions.map((question, index) => ({
        questionId: question.id,
        text: question.text,
        options: question.options,
        correctIndex: question.correctIndex,
        selectedIndex: answers[index].selectedIndex,
        isCorrect: answers[index].isCorrect,
        explanation: question.explanation,
      })),
    },
  });
});

/** GET /api/attempts/mine */
export const myAttempts = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate({ path: 'quiz', select: 'title cover category difficulty' });

  res.json({
    success: true,
    data: {
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        quiz: attempt.quiz
          ? {
              id: attempt.quiz.id,
              title: attempt.quiz.title,
              cover: attempt.quiz.cover,
              category: attempt.quiz.category,
              difficulty: attempt.quiz.difficulty,
            }
          : null,
        score: attempt.score,
        percentage: attempt.percentage,
        correctCount: attempt.correctCount,
        totalQuestions: attempt.totalQuestions,
        durationMs: attempt.durationMs,
        createdAt: attempt.createdAt,
      })),
    },
  });
});

/** GET /api/leaderboard - global ranking by average score */
export const globalLeaderboard = asyncHandler(async (_req, res) => {
  const rows = await Attempt.aggregate([
    {
      $group: {
        _id: '$user',
        attempts: { $sum: 1 },
        averageScore: { $avg: '$percentage' },
        totalCorrect: { $sum: '$correctCount' },
        bestScore: { $max: '$percentage' },
      },
    },
    { $sort: { averageScore: -1, bestScore: -1, attempts: -1 } },
    { $limit: 25 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        attempts: 1,
        totalCorrect: 1,
        bestScore: 1,
        averageScore: { $round: ['$averageScore', 0] },
      },
    },
  ]);

  res.json({ success: true, data: { leaderboard: rows } });
});
