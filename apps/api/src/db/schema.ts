import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  decimal,
  jsonb,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

// Task management enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'viewer']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'archived']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);

// Treasury enums
export const accountTypeEnum = pgEnum('account_type', ['wallet', 'exchange', 'custodian', 'pool']);
export const chainEnum = pgEnum('chain', [
  'ethereum',
  'polygon',
  'arbitrum',
  'optimism',
  'base',
  'solana',
]);
export const credentialTypeEnum = pgEnum('credential_type', [
  'api_key',
  'private_key',
  'seed_phrase',
  'oauth_token',
  'webhook_secret',
]);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'submitted',
  'confirmed',
  'failed',
  'rolled_back',
]);
export const ruleActionEnum = pgEnum('rule_action', ['allow', 'deny', 'require_approval']);

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

/**
 * TREASURY TABLES
 * Full audit trail and rules engine for agent financial transactions
 */

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  chain: chainEnum('chain').notNull(),
  address: varchar('address', { length: 255 }).notNull().unique(),
  owner: varchar('owner', { length: 255 }).notNull(),
  balance: decimal('balance', { precision: 36, scale: 18 }).notNull().default('0'),
  balanceUpdatedAt: timestamp('balance_updated_at').defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const credentials = pgTable('credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  type: credentialTypeEnum('type').notNull(),
  encryptedValue: text('encrypted_value').notNull(),
  vaultKeyId: varchar('vault_key_id', { length: 255 }),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  publicKey: varchar('public_key', { length: 255 }).notNull().unique(),
  description: text('description'),
  version: varchar('version', { length: 50 }).notNull().default('1.0.0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const agentPermissions = pgTable('agent_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  maxTransactionSize: decimal('max_transaction_size', { precision: 36, scale: 18 }).notNull(),
  dailyLimit: decimal('daily_limit', { precision: 36, scale: 18 }).notNull(),
  dailyUsed: decimal('daily_used', { precision: 36, scale: 18 }).notNull().default('0'),
  dailyResetAt: timestamp('daily_reset_at').defaultNow(),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id),
  txHash: varchar('tx_hash', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  fromAddress: varchar('from_address', { length: 255 }).notNull(),
  toAddress: varchar('to_address', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 36, scale: 18 }).notNull(),
  fee: decimal('fee', { precision: 36, scale: 18 }).notNull().default('0'),
  metadata: jsonb('metadata'),
  status: transactionStatusEnum('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  approvedBy: uuid('approved_by').references(() => agents.id),
  executedAt: timestamp('executed_at'),
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const treasuryRules = pgTable('treasury_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  action: ruleActionEnum('action').notNull(),
  agentIds: uuid('agent_ids').array(),
  accountIds: uuid('account_ids').array(),
  transactionTypes: varchar('transaction_types', { length: 50 }).array(),
  maxAmountPerTx: decimal('max_amount_per_tx', { precision: 36, scale: 18 }),
  maxAmountPerDay: decimal('max_amount_per_day', { precision: 36, scale: 18 }),
  allowedChains: chainEnum('allowed_chains').array(),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const approvals = pgTable('approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  approvedAt: timestamp('approved_at'),
  rejectedAt: timestamp('rejected_at'),
  approvedBy: varchar('approved_by', { length: 255 }),
  rejectionReason: text('rejection_reason'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
});

export const liquidityPools = pgTable('liquidity_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  totalCapacity: decimal('total_capacity', { precision: 36, scale: 18 }).notNull(),
  availableBalance: decimal('available_balance', { precision: 36, scale: 18 }).notNull(),
  reserved: decimal('reserved', { precision: 36, scale: 18 }).notNull().default('0'),
  accountIds: uuid('account_ids').array().notNull(),
  chain: chainEnum('chain').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: varchar('action', { length: 100 }).notNull(),
  agentId: uuid('agent_id').references(() => agents.id),
  transactionId: uuid('transaction_id').references(() => transactions.id),
  details: jsonb('details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
