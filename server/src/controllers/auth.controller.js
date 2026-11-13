import { User } from '../models/User.js';
import { Attempt } from '../models/Attempt.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const user = await User.create({ name, email, password, role: 'user' });

  res.status(201).json({
    success: true,
    message: 'Account created',
    data: { token: signToken(user), user: user.toJSON() },
  });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +tokenVersion');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Invalid email or password');

  user.password = undefined;
  res.json({
    success: true,
    message: 'Logged in',
    data: { token: signToken(user), user: user.toJSON() },
  });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({ user: req.user._id }).select('percentage');
  const best = attempts.reduce((max, attempt) => Math.max(max, attempt.percentage), 0);
  const average = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
    : 0;

  res.json({
    success: true,
    data: {
      user: req.user.toJSON(),
      stats: { attempts: attempts.length, bestScore: best, averageScore: average },
    },
  });
});

/** POST /api/auth/logout - revokes every token issued before now */
export const logout = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  res.json({ success: true, message: 'Logged out' });
});

/** PATCH /api/auth/profile */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  if (req.body.name) user.name = req.body.name;
  if (req.body.password) user.password = req.body.password;
  await user.save();

  res.json({ success: true, message: 'Profile updated', data: { user: user.toJSON() } });
});
