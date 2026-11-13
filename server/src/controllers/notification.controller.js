import { Notification } from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

/** GET /api/notifications */
export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  const unread = await Notification.countDocuments({ user: req.user._id, read: false });

  res.json({ success: true, data: { notifications: notifications.map((item) => item.toJSON()), unread } });
});

/** PATCH /api/notifications/:id/read */
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  res.json({ success: true, data: { notification: notification.toJSON() } });
});

/** PATCH /api/notifications/read-all */
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});
