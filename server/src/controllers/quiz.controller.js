import mongoose from 'mongoose';
import { Quiz } from '../models/Quiz.js';
import { Attempt } from '../models/Attempt.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const POPULATE_AUTHOR = { path: 'createdBy', select: 'name' };

/** Can this user edit/see answers for this quiz? */
function canManage(user, quiz) {
  if (!user) return false;
  return user.role === 'admin' || String(quiz.createdBy?._id ?? quiz.createdBy) === String(user.id);
}

/** GET /api/quizzes - search, filter, sort and paginate published quizzes */
export const listQuizzes = asyncHandler(async (req, res) => {
  const { search, category, difficulty, sort, page, limit } = req.query;

  const filter = { isPublished: true };
  if (category !== 'all') filter.category = category;
  if (difficulty !== 'all') filter.difficulty = difficulty;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }, { category: pattern }];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    popular: { plays: -1, createdAt: -1 },
    az: { title: 1 },
  };

  const [quizzes, total] = await Promise.all([
    Quiz.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_AUTHOR),
    Quiz.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      quizzes: quizzes.map((quiz) => quiz.toPublicJSON({ includeQuestions: false })),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

/** GET /api/quizzes/categories */
export const listCategories = asyncHandler(async (_req, res) => {
  const rows = await Quiz.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);
  res.json({
    success: true,
    data: { categories: rows.map((row) => ({ name: row._id, count: row.count })) },
  });
});

/** GET /api/quizzes/:id */
export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate(POPULATE_AUTHOR);
  if (!quiz) throw ApiError.notFound('Quiz not found');

  const manager = canManage(req.user, quiz);
  if (!quiz.isPublished && !manager) throw ApiError.notFound('Quiz not found');

  res.json({ success: true, data: { quiz: quiz.toPublicJSON({ includeAnswers: manager }) } });
});

/** POST /api/quizzes (admin only) */
export const createQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
  await quiz.populate(POPULATE_AUTHOR);
  res.status(201).json({
    success: true,
    message: 'Quiz created',
    data: { quiz: quiz.toPublicJSON({ includeAnswers: true }) },
  });
});

/** PUT /api/quizzes/:id (admin or owner) */
export const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw ApiError.notFound('Quiz not found');
  if (req.user.role !== 'admin' && String(quiz.createdBy) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only edit quizzes you created');
  }

  Object.assign(quiz, req.body);
  await quiz.save();
  await quiz.populate(POPULATE_AUTHOR);

  res.json({
    success: true,
    message: 'Quiz updated',
    data: { quiz: quiz.toPublicJSON({ includeAnswers: true }) },
  });
});

/** DELETE /api/quizzes/:id (admin or owner) */
export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw ApiError.notFound('Quiz not found');
  if (req.user.role !== 'admin' && String(quiz.createdBy) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only delete quizzes you created');
  }

  await Promise.all([
    quiz.deleteOne(),
    Attempt.deleteMany({ quiz: quiz._id }),
  ]);

  res.json({ success: true, message: 'Quiz deleted' });
});

/** GET /api/quizzes/mine - quizzes created by the signed-in user */
export const listMyQuizzes = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
  const quizzes = await Quiz.find(filter).sort({ createdAt: -1 }).populate(POPULATE_AUTHOR);
  res.json({ success: true, data: { quizzes: quizzes.map((quiz) => quiz.toPublicJSON({ includeAnswers: true })) } });
});

/** GET /api/quizzes/:id/leaderboard - best attempt per player */
export const quizLeaderboard = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid quiz id');

  const rows = await Attempt.aggregate([
    { $match: { quiz: new mongoose.Types.ObjectId(req.params.id) } },
    { $sort: { percentage: -1, durationMs: 1 } },
    {
      $group: {
        _id: '$user',
        best: { $first: '$$ROOT' },
      },
    },
    { $sort: { 'best.percentage': -1, 'best.durationMs': 1 } },
    { $limit: 20 },
    {
      $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        percentage: '$best.percentage',
        score: '$best.score',
        durationMs: '$best.durationMs',
        createdAt: '$best.createdAt',
      },
    },
  ]);

  res.json({ success: true, data: { leaderboard: rows } });
});
