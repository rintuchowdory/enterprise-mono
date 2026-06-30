#!/usr/bin/env bash
# Apply the production CORS/deployment fix to enterprise-mono.
# Run this from inside your local clone of the repo:
#
#   cd enterprise-mono
#   bash apply-enterprise-mono-fix.sh
#
# It will: remove stray compiled .js files, write all the new/changed
# files, then leave the changes staged so you can review with
# `git diff --cached` before committing and pushing.

set -euo pipefail

if [ ! -f "package.json" ] || [ ! -d "apps/api" ] || [ ! -d "apps/web" ]; then
  echo "Run this from the root of your enterprise-mono clone (where package.json lives)."
  exit 1
fi

echo "==> Removing stray compiled .js files that shadow the real .ts/.tsx source..."
rm -f apps/web/src/App.js \
      apps/web/src/main.js \
      apps/web/src/api/client.js \
      apps/web/src/api/tasks.js \
      apps/web/src/api/users.js \
      apps/web/src/pages/TaskBoard.js \
      packages/shared/src/index.js \
      packages/shared/src/schemas/task.js \
      packages/shared/src/schemas/user.js \
      packages/shared/src/types/api.js
rm -f apps/api/tsconfig.tsbuildinfo apps/web/tsconfig.tsbuildinfo \
      packages/shared/tsconfig.tsbuildinfo packages/ui/tsconfig.tsbuildinfo

echo "==> Writing .npmrc (hoists deps so the Vercel function can resolve apps/api's deps)..."
cat > .npmrc << 'EOF'
# The Vercel serverless function at /api/[...path].ts imports apps/api's
# Fastify app. Vercel's function bundler resolves modules by walking up
# node_modules from the function file's location, but pnpm's default
# symlink layout only places dependencies inside each workspace package's
# own node_modules (e.g. apps/api/node_modules/fastify), not at the repo
# root where /api lives. Hoisting ensures fastify, drizzle-orm, postgres,
# zod, etc. are resolvable from /api as well.
shamefully-hoist=true
EOF

echo "==> Writing apps/api/src/app.ts (reusable buildApp, used by both local dev and Vercel)..."
cat > apps/api/src/app.ts << 'EOF'
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
EOF

echo "==> Rewriting apps/api/src/index.ts (local dev entrypoint, now uses buildApp)..."
cat > apps/api/src/index.ts << 'EOF'
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
EOF

echo "==> Fixing apps/api/src/db/index.ts (capping pool connections for serverless)..."
cat > apps/api/src/db/index.ts << 'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL!;
// Serverless functions spin up many short-lived instances, each of which
// would otherwise open its own connection pool. Capping at 1 connection
// per function instance avoids exhausting your Postgres connection limit
// (important on Neon/Supabase free tiers). If you're connecting through a
// pooler (e.g. Neon's pooled connection string ending in `-pooler`), this
// is doubly safe.
const client = postgres(connectionString, { max: 1 });

export const db = drizzle(client, { schema });
export type DB = typeof db;
EOF

echo "==> Creating the Vercel serverless catch-all function at api/[...path].ts..."
mkdir -p "api"
cat > "api/[...path].ts" << 'EOF'
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
EOF

echo "==> Fixing apps/web/src/api/client.ts (relative /api/v1 base URL instead of localhost:3001)..."
cat > apps/web/src/api/client.ts << 'EOF'
import axios from 'axios';

// Relative path: in dev this is proxied by Vite to the local API (see
// vite.config.ts), and in production it resolves to the same Vercel
// deployment's serverless function — no hardcoded host, no CORS issue.
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res: any) => res,
  (err: any) => Promise.reject(err),
);

export const get = <T>(url: string) => api.get<T>(url);
export const post = <T>(url: string, data: unknown) => api.post<T>(url, data);
export const patch = <T>(url: string, data: unknown) => api.patch<T>(url, data);
export const del = (url: string) => api.delete(url);
EOF

echo "==> Fixing apps/web/package.json build script (tsc --noEmit instead of tsc -b, stops stray .js regeneration)..."
cat > apps/web/package.json << 'EOF'
{
  "name": "@repo/web",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "@repo/shared": "workspace:*",
    "@repo/ui": "workspace:*",
    "@tanstack/react-query": "^5.51.0",
    "@tanstack/react-router": "^1.45.0",
    "axios": "^1.16.1",
    "lucide-react": "^1.21.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.4"
  }
}
EOF

echo "==> Fixing apps/web/tsconfig.json (adding noEmit: true)..."
cat > apps/web/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@repo/shared": ["../../packages/shared/src/index.ts"],
      "@repo/ui": ["../../packages/ui/src/index.ts"]
    }
  },
  "include": ["src"]
}
EOF

echo "==> Fixing packages/shared/src/index.ts (explicit .js extensions for native Node ESM resolution)..."
cat > packages/shared/src/index.ts << 'EOF'
export * from './schemas/user.js';
export * from './schemas/task.js';
export * from './types/api.js';
EOF

echo "==> Updating vercel.json (function config + SPA fallback rewrite)..."
cat > vercel.json << 'EOF'
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "apps/web/dist",
  "installCommand": "pnpm install",
  "functions": {
    "api/[...path].ts": {
      "memory": 1024,
      "maxDuration": 15
    }
  },
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
EOF

echo "==> Updating .gitignore (ignore tsbuildinfo so it doesn't get re-committed)..."
cat > .gitignore << 'EOF'
node_modules/
dist/
.turbo/
.env
.env.local
*.env
.vercel
*.tsbuildinfo
EOF

echo ""
echo "==> Installing deps and building to verify everything compiles cleanly..."
pnpm install
pnpm run build

echo ""
echo "==> All done. Staging changes..."
git add -A
git status --short

echo ""
echo "Review the diff with:  git diff --cached"
echo "Then commit and push with:"
echo ""
echo "  git commit -m \"fix: deploy API as Vercel serverless function, fix CORS/localhost bug\""
echo "  git push origin main"
echo ""
echo "After pushing, set DATABASE_URL (and optionally CORS_ORIGIN) as a Production"
echo "environment variable in your Vercel project settings before the deploy finishes,"
echo "or the API routes will 500 once they hit the database."
