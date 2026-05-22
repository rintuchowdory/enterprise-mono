import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'viewer']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'archived']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: userRoleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
