import { FastifyInstance } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';

export async function agentRoutes(app: FastifyInstance) {
  app.get('/agents', async (_req, reply) => {
    const rows = await db.select().from(agents).orderBy(desc(agents.createdAt));
    return reply.send({ data: rows, meta: { total: rows.length } });
  });

  app.get<{ Params: { id: string } }>('/agents/:id', async (req, reply) => {
    const [agent] = await db.select().from(agents).where(eq(agents.id, req.params.id));
    if (!agent) return reply.status(404).send({ error: 'Not found', code: 'NOT_FOUND' });
    return reply.send({ data: agent });
  });

  app.post('/agents', async (req, reply) => {
    const body = req.body as {
      name: string;
      description?: string;
      version?: string;
    };
    if (!body.name?.trim()) {
      return reply.status(400).send({ error: 'name is required', code: 'VALIDATION_ERROR' });
    }
    const [agent] = await db.insert(agents).values({
      name: body.name.trim(),
      publicKey: `pk_live_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      description: body.description?.trim() || null,
      version: body.version?.trim() || '1.0.0',
      isActive: true,
    }).returning();
    return reply.status(201).send({ data: agent });
  });

  app.patch<{ Params: { id: string } }>('/agents/:id', async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    const [agent] = await db
      .update(agents)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(agents.id, req.params.id))
      .returning();
    if (!agent) return reply.status(404).send({ error: 'Not found', code: 'NOT_FOUND' });
    return reply.send({ data: agent });
  });

  app.delete<{ Params: { id: string } }>('/agents/:id', async (req, reply) => {
    const [deleted] = await db.delete(agents).where(eq(agents.id, req.params.id)).returning();
    if (!deleted) return reply.status(404).send({ error: 'Not found', code: 'NOT_FOUND' });
    return reply.status(204).send();
  });
}
