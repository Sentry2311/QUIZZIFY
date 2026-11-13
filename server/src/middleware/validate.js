import { ApiError } from '../utils/ApiError.js';

/**
 * Validate req[source] against a zod schema and replace it with the parsed
 * (and coerced) value. Returns 400 with per-field details on failure.
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    return next();
  };
}
