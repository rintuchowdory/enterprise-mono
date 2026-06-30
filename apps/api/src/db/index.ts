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
