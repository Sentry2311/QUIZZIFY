import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, tv: user.tokenVersion ?? 0 },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/** Bearer token from the Authorization header, if present. */
export function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}
