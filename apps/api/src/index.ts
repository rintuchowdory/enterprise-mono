import { buildApp } from './app.js';

const port = Number(process.env.PORT) || 3001;

try {
  const app = await buildApp();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 API running on http://localhost:${port}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
