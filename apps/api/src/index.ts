import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { userRoutes } from './routes/users.js';
import { taskRoutes } from './routes/tasks.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: process.env.CORS_ORIGIN || 'http://localhost:5173' });
await app.register(helmet);

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

await app.register(userRoutes, { prefix: '/api/v1' });
await app.register(taskRoutes, { prefix: '/api/v1' });

const port = Number(process.env.PORT) || 3001;
try {
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 API running on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
