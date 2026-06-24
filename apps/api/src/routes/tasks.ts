import { FastifyInstance } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tasks } from '../db/schema.js';
import { CreateTaskSchema, UpdateTaskSchema } from '@repo/shared';

export async function taskRoutes(app: FastifyInstance) {
  app.get('/tasks', async (req, reply) => {
    const rows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    return reply.send({ data: rows, meta: { total: rows.length } });
  });

  app.get<{ Params: { id: string } }>('/tasks/:id', async (req, reply) => {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, req.params.id));
    if (!task) return reply.status(404).send({ error: 'Not found', code: 'NOT_FOUND' });
    return reply.send({ data: task });
  });

  app.post('/tasks', async (req, reply) => {
    const parsed = CreateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
    }
    const [task] = await db.insert(tasks).values({
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    }).returning();
    return reply.status(201).send({ data: task });
  });

  app.patch<{ Params: { id: string } }>('/tasks/:id', async (req, reply) => {
    const parsed = UpdateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
    }
    const [task] = await db
      .update(tasks)
      .set({
        ...parsed.data,
        dueDate: parsed.data.dueDate !== undefined
          ? (parsed.data.dueDate ? new Date(parsed.data.dueDate) : null)
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, req.params.id))
      .returning();
    if (!task) return reply.status(404).send({ error: 'Not found', code: 'NOT_FOUND' });
    return reply.send({ data: task });
  });

  app.delete<{ Params: { id: string } }>('/tasks/:id', async (req, reply) => {
    const [deleted] = await db.delete(tasks).where(eq(tasks.id, req.params.id)).returning();
    if (!deleted) return reply.status(404).send({ error: 'Not found', code: 'NOT_FOUND' });
    return reply.status(204).send();
  });
}
