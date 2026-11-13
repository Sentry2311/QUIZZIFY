import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: [400, 'Question text must be at most 400 characters'],
    },
    options: {
      type: [String],
      validate: {
        validator(options) {
          return (
            Array.isArray(options) &&
            options.length >= 2 &&
            options.length <= 6 &&
            options.every((option) => typeof option === 'string' && option.trim().length > 0)
          );
        },
        message: 'Each question needs between 2 and 6 non-empty options',
      },
      required: true,
    },
    correctIndex: {
      type: Number,
      required: [true, 'A correct answer index is required'],
      min: [0, 'Correct answer index cannot be negative'],
      validate: {
        validator(value) {
          return Number.isInteger(value) && value < this.options.length;
        },
        message: 'Correct answer index must point at one of the options',
      },
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [400, 'Explanation must be at most 400 characters'],
      default: '',
    },
    points: { type: Number, default: 10, min: 1, max: 100 },
    timeLimitSeconds: { type: Number, default: 20, min: 5, max: 120 },
  },
  { _id: true },
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [600, 'Description must be at most 600 characters'],
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: 40,
      default: 'General',
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be easy, medium or hard',
      },
      default: 'medium',
    },
    cover: { type: String, default: '🧠', maxlength: 8 },
    timeLimitSeconds: { type: Number, default: 20, min: 5, max: 120 },
    questions: {
      type: [questionSchema],
      validate: {
        validator(questions) {
          return Array.isArray(questions) && questions.length > 0 && questions.length <= 50;
        },
        message: 'A quiz needs between 1 and 50 questions',
      },
    },
    isPublished: { type: Boolean, default: true },
    plays: { type: Number, default: 0, min: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Supports the browse page filters (published + category + difficulty, newest first).
quizSchema.index({ isPublished: 1, category: 1, difficulty: 1, createdAt: -1 });
quizSchema.index({ title: 'text', description: 'text' });

quizSchema.virtual('questionCount').get(function questionCount() {
  return this.questions?.length ?? 0;
});

quizSchema.virtual('totalPoints').get(function totalPoints() {
  return (this.questions ?? []).reduce((sum, question) => sum + (question.points || 10), 0);
});

/**
 * Shape sent to players. Correct answers are stripped unless the caller is
 * allowed to see them (quiz owner or admin).
 */
quizSchema.methods.toPublicJSON = function toPublicJSON({ includeAnswers = false, includeQuestions = true } = {}) {
  return {
    id: this.id,
    title: this.title,
    description: this.description,
    category: this.category,
    difficulty: this.difficulty,
    cover: this.cover,
    timeLimitSeconds: this.timeLimitSeconds,
    questionCount: this.questionCount,
    totalPoints: this.totalPoints,
    plays: this.plays,
    isPublished: this.isPublished,
    createdBy: this.createdBy?.name
      ? { id: this.createdBy.id, name: this.createdBy.name }
      : this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ...(includeQuestions
      ? { questions: this.buildQuestions(includeAnswers) }
      : {}),
  };
};

/** Map embedded questions, optionally exposing the correct answers. */
quizSchema.methods.buildQuestions = function buildQuestions(includeAnswers) {
  return (this.questions ?? []).map((question) => ({
      id: question.id,
      text: question.text,
      options: question.options,
      points: question.points,
      timeLimitSeconds: question.timeLimitSeconds,
      ...(includeAnswers
        ? { correctIndex: question.correctIndex, explanation: question.explanation }
        : {}),
  }));
};

export const Quiz = mongoose.model('Quiz', quizSchema);
