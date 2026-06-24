import { FastifyInstance } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  transactions,
  agents,
  accounts,
  agentPermissions,
  treasuryRules,
  approvals,
  auditLog,
} from '../db/schema.js';
import { z } from 'zod';

/**
 * REQUEST/RESPONSE TYPES
 */
const ExecuteTransactionSchema = z.object({
  agentId: z.string().uuid(),
  accountId: z.string().uuid(),
  type: z.enum(['transfer', 'swap', 'stake', 'bridge', 'custom']),
  toAddress: z.string(),
  amount: z.string(),
  metadata: z.record(z.any()).optional(),
});

type ExecuteTransactionRequest = z.infer<typeof ExecuteTransactionSchema>;

/**
 * TREASURY RULES ENGINE
 * Evaluates all rules to determine if transaction is allowed
 */
async function evaluateRules(req: ExecuteTransactionRequest, agent: any, account: any) {
  const rules = await db
    .select()
    .from(treasuryRules)
    .where(eq(treasuryRules.isActive, true))
    .orderBy(desc(treasuryRules.priority));

  for (const rule of rules) {
    const agentMatches = !rule.agentIds || rule.agentIds.includes(req.agentId);
    const accountMatches = !rule.accountIds || rule.accountIds.includes(req.accountId);
    const typeMatches = !rule.transactionTypes || rule.transactionTypes.includes(req.type);
    const chainMatches = !rule.allowedChains || rule.allowedChains.includes(account.chain);

    if (!agentMatches || !accountMatches || !typeMatches || !chainMatches) {
      continue;
    }

    if (rule.action === 'deny') {
      return {
        allowed: false,
        reason: `Treasury rule denied: ${rule.name}`,
        requiresApproval: false,
      };
    }

    if (rule.action === 'require_approval') {
      return {
        allowed: true,
        reason: `Treasury rule requires approval: ${rule.name}`,
        requiresApproval: true,
      };
    }

    const amountDecimal = BigInt(req.amount);
    if (rule.maxAmountPerTx && amountDecimal > BigInt(rule.maxAmountPerTx)) {
      return {
        allowed: false,
        reason: `Exceeds max amount per transaction: ${rule.maxAmountPerTx}`,
        requiresApproval: false,
      };
    }
  }

  return { allowed: true, reason: 'Passed treasury rules evaluation', requiresApproval: false };
}

/**
 * AGENT PERMISSION CHECK
 * Verify agent has permission + hasn't exceeded limits
 */
async function checkAgentPermissions(
  agentId: string,
  accountId: string,
  amount: string,
) {
  const [permission] = await db
    .select()
    .from(agentPermissions)
    .where(
      and(eq(agentPermissions.agentId, agentId), eq(agentPermissions.accountId, accountId)),
    );

  if (!permission) {
    return { allowed: false, reason: 'Agent does not have permission for this account' };
  }

  const amountDecimal = BigInt(amount);
  const maxTxSize = BigInt(permission.maxTransactionSize);

  if (amountDecimal > maxTxSize) {
    return {
      allowed: false,
      reason: `Exceeds max transaction size: ${permission.maxTransactionSize}`,
    };
  }

  const dailyUsed = BigInt(permission.dailyUsed);
  const dailyLimit = BigInt(permission.dailyLimit);

  if (dailyUsed + amountDecimal > dailyLimit) {
    return {
      allowed: false,
      reason: `Would exceed daily limit. Used: ${permission.dailyUsed}, Limit: ${permission.dailyLimit}`,
    };
  }

  return {
    allowed: true,
    requiresApproval: permission.requiresApproval,
  };
}

/**
 * MAIN TRANSACTION EXECUTION ROUTES
 */
export async function transactionRoutes(app: FastifyInstance) {
  /**
   * POST /transactions/execute
   * Core endpoint: agent requests to execute a transaction
   */
  app.post<{ Body: ExecuteTransactionRequest }>('/transactions/execute', async (req, reply) => {
    const parsed = ExecuteTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.errors,
      });
    }

    const { agentId, accountId, type, toAddress, amount, metadata } = parsed.data;

    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.isActive, true)));

    if (!agent) {
      return reply.status(403).send({
        error: 'Agent not found or inactive',
        code: 'AGENT_NOT_FOUND',
      });
    }

    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.isActive, true)));

    if (!account) {
      return reply.status(403).send({
        error: 'Account not found or inactive',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    const amountBigInt = BigInt(amount);
    const accountBalance = BigInt(account.balance);

    if (amountBigInt > accountBalance) {
      return reply.status(400).send({
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE',
        balance: account.balance,
        requested: amount,
      });
    }

    const permissionCheck = await checkAgentPermissions(agentId, accountId, amount);
    if (!permissionCheck.allowed) {
      await db.insert(auditLog).values({
        action: 'transaction_rejected_permission',
        agentId,
        details: { reason: permissionCheck.reason, request: parsed.data },
      });

      return reply.status(403).send({
        error: permissionCheck.reason,
        code: 'PERMISSION_DENIED',
      });
    }

    const ruleCheck = await evaluateRules(parsed.data, agent, account);
    if (!ruleCheck.allowed) {
      await db.insert(auditLog).values({
        action: 'transaction_rejected_rules',
        agentId,
        details: { reason: ruleCheck.reason, request: parsed.data },
      });

      return reply.status(403).send({
        error: ruleCheck.reason,
        code: 'RULE_VIOLATION',
      });
    }

    const [transaction] = await db
      .insert(transactions)
      .values({
        agentId,
        accountId,
        type,
        fromAddress: account.address,
        toAddress,
        amount,
        metadata,
        status: 'pending',
      })
      .returning();

    if (ruleCheck.requiresApproval || permissionCheck.requiresApproval) {
      await db.insert(approvals).values({
        transactionId: transaction.id,
        status: 'pending',
      });

      await db.insert(auditLog).values({
        action: 'transaction_awaiting_approval',
        agentId,
        transactionId: transaction.id,
        details: { reason: ruleCheck.reason },
      });

      return reply.status(202).send({
        data: transaction,
        status: 'awaiting_approval',
        message: 'Transaction created and is awaiting approval',
      });
    }

    try {
      const [updated] = await db
        .update(transactions)
        .set({
          status: 'submitted',
          executedAt: new Date(),
        })
        .where(eq(transactions.id, transaction.id))
        .returning();

      await db.insert(auditLog).values({
        action: 'transaction_submitted',
        agentId,
        transactionId: transaction.id,
        details: { account: account.address, toAddress, amount },
      });

      return reply.status(201).send({
        data: updated,
        status: 'submitted',
        message: 'Transaction submitted to blockchain',
      });
    } catch (error) {
      const [failed] = await db
        .update(transactions)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(transactions.id, transaction.id))
        .returning();

      await db.insert(auditLog).values({
        action: 'transaction_execution_failed',
        agentId,
        transactionId: transaction.id,
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      return reply.status(500).send({
        error: 'Transaction execution failed',
        code: 'EXECUTION_ERROR',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /transactions/:id
   * Check transaction status
   */
  app.get<{ Params: { id: string } }>('/transactions/:id', async (req, reply) => {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, req.params.id));

    if (!transaction) {
      return reply.status(404).send({ error: 'Transaction not found' });
    }

    return reply.send({ data: transaction });
  });

  /**
   * GET /transactions/agent/:agentId
   * List agent's transaction history
   */
  app.get<{ Params: { agentId: string } }>(
    '/transactions/agent/:agentId',
    async (req, reply) => {
      const rows = await db
        .select()
        .from(transactions)
        .where(eq(transactions.agentId, req.params.agentId))
        .orderBy(desc(transactions.createdAt));

      return reply.send({
        data: rows,
        meta: { total: rows.length },
      });
    },
  );

  /**
   * POST /approvals/:id/approve
   * Human approves a pending transaction
   */
  app.post<{ Params: { id: string } }>(
    '/approvals/:id/approve',
    async (req, reply) => {
      const [approval] = await db
        .select()
        .from(approvals)
        .where(eq(approvals.id, req.params.id));

      if (!approval || approval.status !== 'pending') {
        return reply.status(400).send({ error: 'Approval not found or already processed' });
      }

      const [updated] = await db
        .update(approvals)
        .set({
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: (req.body as any)?.approvedBy || 'system',
        })
        .where(eq(approvals.id, req.params.id))
        .returning() as unknown as (typeof approvals.$inferSelect)[];

      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, approval.transactionId));

      await db.insert(auditLog).values({
        action: 'transaction_approved',
        transactionId: transaction.id,
        details: { approvedBy: updated.approvedBy },
      });

      return reply.send({
        data: updated,
        message: 'Transaction approved and submitted',
      });
    },
  );
}
