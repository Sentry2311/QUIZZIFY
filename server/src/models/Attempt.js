import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedIndex: { type: Number, default: null, min: 0 },
    isCorrect: { type: Boolean, default: false },
    timeMs: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    correctCount: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 1 },
    score: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    durationMs: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// Leaderboard per quiz and a user's recent history.
attemptSchema.index({ quiz: 1, percentage: -1, durationMs: 1 });
attemptSchema.index({ user: 1, createdAt: -1 });

export const Attempt = mongoose.model('Attempt', attemptSchema);
