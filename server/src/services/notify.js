import { Notification } from '../models/Notification.js';

/**
 * Persist a notification and push it to that user's realtime channel.
 * Failures are logged but never break the originating request.
 */
export async function notify(io, userId, { type = 'system', title, message = '', link = '' }) {
  try {
    const notification = await Notification.create({ user: userId, type, title, message, link });
    io?.to(`user:${userId}`).emit('notification', notification.toJSON());
    return notification;
  } catch (error) {
    console.error('[notify] failed to send notification', error.message);
    return null;
  }
}
