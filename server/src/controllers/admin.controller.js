import { User } from '../models/User.js';
import { Quiz } from '../models/Quiz.js';
import { Attempt } from '../models/Attempt.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** GET /api/admin/stats */
export const getStats = asyncHandler(async (_req, res) => {
  const [users, quizzes, attempts, avg, topQuizzes, recent] = await Promise.all([
    User.countDocuments(),
    Quiz.countDocuments(),
    Attempt.countDocuments(),
    Attempt.aggregate([{ $group: { _id: null, average: { $avg: '$percentage' } } }]),
    Quiz.find().sort({ plays: -1 }).limit(5).select('title plays category cover'),
    Attempt.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate({ path: 'user', select: 'name' })
      .populate({ path: 'quiz', select: 'title' }),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        users,
        quizzes,
        attempts,
        averageScore: Math.round(avg[0]?.average ?? 0),
      },
      topQuizzes: topQuizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        category: quiz.category,
        cover: quiz.cover,
        plays: quiz.plays,
      })),
      recentAttempts: recent.map((attempt) => ({
        id: attempt.id,
        user: attempt.user?.name ?? 'Deleted user',
        quiz: attempt.quiz?.title ?? 'Deleted quiz',
        percentage: attempt.percentage,
        createdAt: attempt.createdAt,
      })),
    },
  });
});

/** GET /api/admin/users?search=&page=&limit= */
export const listUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const search = (req.query.search || '').trim();

  const filter = search
    ? { $or: [{ name: new RegExp(escapeRegex(search), 'i') }, { email: new RegExp(escapeRegex(search), 'i') }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email role createdAt'),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { users: users.map((user) => user.toJSON()), page, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/** PATCH /api/admin/users/:id/role */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) throw ApiError.badRequest('Role must be user or admin');
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot change your own role');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');

  res.json({ success: true, message: 'Role updated', data: { user: user.toJSON() } });
});
