import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['result', 'achievement', 'quiz', 'system'],
      default: 'system',
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, default: '', trim: true, maxlength: 300 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
