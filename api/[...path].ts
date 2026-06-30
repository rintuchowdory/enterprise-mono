import type { IncomingMessage, ServerResponse } from 'http';
import { buildApp } from '../apps/api/src/app';
import type { FastifyInstance } from 'fastify';

// Fastify instances are expensive to build (plugin registration, schema
// compilation, DB pool setup). Reuse the same instance across invocations
// of the same serverless function container (warm starts).
let appPromise: Promise<FastifyInstance> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  // Fastify wraps a standard Node http.Server. Emitting the raw request
  // onto it lets Fastify's router handle the request exactly as it would
  // for a normal `app.listen()` server, without spinning up a TCP listener
  // (which isn't possible/needed in a serverless function).
  app.server.emit('request', req, res);
}
