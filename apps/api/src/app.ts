import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { userRoutes } from './routes/users.js';
import { taskRoutes } from './routes/tasks.js';
import { transactionRoutes } from './routes/transactions.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  const corsOrigin = process.env.CORS_ORIGIN;
  await app.register(cors, {
    // In production the frontend and API share the same origin (same Vercel
    // deployment), so cross-origin requests typically only happen in local
    // dev or preview environments. Reflect the request origin by default;
    // set CORS_ORIGIN to lock this down to a specific origin.
    origin: corsOrigin ? corsOrigin.split(',') : true,
  });
  await app.register(helmet);

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await app.register(userRoutes, { prefix: '/api/v1' });
  await app.register(taskRoutes, { prefix: '/api/v1' });
  await app.register(transactionRoutes, { prefix: '/api/v1' });

  return app;
}
