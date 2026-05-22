# enterprise-mono

A production-grade TypeScript monorepo demonstrating enterprise full-stack patterns.

## Stack

| Layer | Tech |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | React 18 + Vite + TanStack Query + Tailwind |
| Backend | Fastify 4 + Drizzle ORM |
| Database | PostgreSQL 16 |
| Validation | Zod (shared between FE + BE) |
| CI/CD | GitHub Actions |
| Containers | Docker + Docker Compose |

## Structure

```
enterprise-mono/
├── apps/
│   ├── api/          # Fastify REST API
│   └── web/          # React SPA
├── packages/
│   ├── shared/       # Zod schemas + TypeScript types (shared FE/BE)
│   └── ui/           # Shared React component library
├── .github/
│   └── workflows/ci.yml
├── docker-compose.yml
└── turbo.json
```

## Key Architecture Decisions

- **Shared types via `@repo/shared`** — Zod schemas defined once, used in both API validation and React forms. No type drift.
- **Turborepo caching** — only rebuilds affected packages on each commit.
- **Drizzle ORM** — type-safe SQL with zero magic. Schema = source of truth.
- **TanStack Query** — server state management with automatic cache invalidation.

## Quick Start

```bash
# 1. Start DB
docker compose up db -d

# 2. Install
pnpm install

# 3. Push schema
cp apps/api/.env.example apps/api/.env
pnpm db:push

# 4. Dev
pnpm dev
# → API:  http://localhost:3001
# → Web:  http://localhost:5173
```

## Production

```bash
docker compose up --build
```

## API Endpoints

```
GET    /api/v1/tasks
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id

GET    /api/v1/users
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

GET    /health
```
