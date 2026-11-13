import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { extractToken, verifyToken } from '../utils/token.js';

/** Resolve the bearer token to a user and reject revoked tokens. */
async function resolveUser(token) {
  const payload = verifyToken(token);
  // tokenVersion is select:false, so it must be requested explicitly.
  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if ((payload.tv ?? 0) !== user.tokenVersion) {
    throw ApiError.unauthorized('Session expired, please log in again');
  }
  return user;
}

/** Requires a valid JWT; attaches req.user. */
export async function protect(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('Authentication required');
    req.user = await resolveUser(token);
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }
    return next(error);
  }
}

/** Attaches req.user when a valid token is present, but never blocks. */
export async function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = await resolveUser(token);
  } catch {
    req.user = undefined;
  }
  return next();
}

/** Role-based access control: authorize('admin') or authorize('admin', 'owner'). */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
    }
    return next();
  };
}
