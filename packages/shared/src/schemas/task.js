import { z } from 'zod';
export const TaskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'done', 'archived']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    assigneeId: z.string().uuid().nullable(),
    dueDate: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const CreateTaskSchema = TaskSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateTaskSchema = CreateTaskSchema.partial();
