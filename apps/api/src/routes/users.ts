import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { CreateUserSchema, UpdateUserSchema } from '@repo/shared';
import type { ApiResponse, PaginationQuery } from '@repo/shared';

export async function userRoutes(app: FastifyInstance) {
  // GET /users
  app.get<{ Querystring: PaginationQuery }>('/users', async (req, reply) => {
    const { limit = 20, page = 1, search } = req.query;
    const offset = (page - 1) * limit;

    const rows = await db.select().from(users).limit(limit).offset(offset);
    const total = await db.$count(users);

    const response: ApiResponse<typeof rows> = {
      data: rows,
      meta: { total, page, limit },
    };
    return reply.send(response);
  });

  // GET /users/:id
  app.get<{ Params: { id: string } }>('/users/:id', async (req, reply) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.params.id));
    if (!user) return reply.status(404).send({ error: 'Not found', code: 'NOT_FOUND' });
    return reply.send({ data: user });
  });

  // POST /users
  app.post('/users', async (req, reply) => {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
    }
    const [user] = await db.insert(users).values(parsed.data).returning();
    return reply.status(201).send({ data: user });
  });

  // PATCH /users/:id
  app.patch<{ Params: { id: string } }>('/users/:id', async (req, reply) => {
    const parsed = UpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
    }
    const [user] = await db
      .update(users)
      .set(parsed.data)
      .where(eq(users.id, req.params.id))
      .returning();
    if (!user) return reply.status(404).send({ error: 'Not found', code: 'NOT_FOUND' });
    return reply.send({ data: user });
  });

  // DELETE /users/:id
  app.delete<{ Params: { id: string } }>('/users/:id', async (req, reply) => {
    const [deleted] = await db.delete(users).where(eq(users.id, req.params.id)).returning();
    if (!deleted) return reply.status(404).send({ error: 'Not found', code: 'NOT_FOUND' });
    return reply.status(204).send();
  });
}
