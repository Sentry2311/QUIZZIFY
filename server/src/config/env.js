import dotenv from 'dotenv';

// `parsed` keeps the .env values even when the parent process exports a variable
// (dotenv never overwrites an existing env var), which lets us recover from a
// meaningless inherited PORT such as 0.
const { parsed: fileEnv = {} } = dotenv.config() ?? {};

const pick = (key, fallback) => process.env[key] ?? fileEnv[key] ?? fallback;

const isProd = process.env.NODE_ENV === 'production';
const jwtSecret = pick('JWT_SECRET', isProd ? undefined : 'quizzify-dev-secret-do-not-use-in-production');

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set in production');
}

const requestedPort = Number(process.env.PORT);
const filePort = Number(fileEnv.PORT);
// A valid process port wins (needed on Render); otherwise use .env; otherwise 5000.
const port = requestedPort > 0 ? requestedPort : filePort > 0 ? filePort : 5000;

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port,
  mongoUri: pick('MONGODB_URI', ''),
  jwtSecret,
  jwtExpiresIn: pick('JWT_EXPIRES_IN', '7d'),
  clientUrls: (pick('CLIENT_URL', 'http://localhost:5173,http://localhost:5180'))
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
};
