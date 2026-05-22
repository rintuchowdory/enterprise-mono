import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formatZodError(result.error),
      });
    }
    req.body = result.data;
  };
}

function formatZodError(err: ZodError): Record<string, string[]> {
  return err.errors.reduce(
    (acc, e) => {
      const key = e.path.join('.');
      acc[key] = [...(acc[key] || []), e.message];
      return acc;
    },
    {} as Record<string, string[]>
  );
}
