import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connect to MongoDB. In development, if no MONGODB_URI is provided we fall back
 * to an ephemeral in-memory MongoDB so the API can boot without extra setup.
 */
export async function connectDB(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);

  let target = uri;
  if (!target) {
    if (env.isProd) {
      throw new Error('MONGODB_URI is required in production');
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const memoryServer = await MongoMemoryServer.create();
    target = memoryServer.getUri('quizzify');
    globalThis.__QUIZZIFY_MEMORY_MONGO__ = memoryServer;
    console.log('[db] No MONGODB_URI set - using an in-memory MongoDB for development');
  }

  await mongoose.connect(target, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.connection.close();
  const memoryServer = globalThis.__QUIZZIFY_MEMORY_MONGO__;
  if (memoryServer) {
    await memoryServer.stop();
    globalThis.__QUIZZIFY_MEMORY_MONGO__ = undefined;
  }
}
