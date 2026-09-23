import { Types } from "mongoose";
import { AuditLog, AuditAction } from "../models/auditLog.model";

interface LogActionInput {
  actor: Types.ObjectId | string;
  action: AuditAction;
  targetType: string;
  targetId: Types.ObjectId | string;
  metadata?: Record<string, unknown>;
}

/**
 * Records an administrative action for the audit trail (spec section 23).
 * Deliberately swallows its own errors and logs to stderr instead of
 * throwing: an audit-log write failing must never roll back or block the
 * real business action (e.g. a hire, a verification, a suspension).
 */
export const logAction = async (input: LogActionInput): Promise<void> => {
  try {
    await AuditLog.create({
      actor: input.actor,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("⚠️  Failed to write audit log entry:", input.action, error);
  }
};

export const listAuditLogs = async (filters: { targetType?: string; targetId?: string; limit?: number } = {}) => {
  const query: Record<string, unknown> = {};
  if (filters.targetType) query.targetType = filters.targetType;
  if (filters.targetId) query.targetId = filters.targetId;

  return AuditLog.find(query)
    .populate("actor", "fullName email role")
    .sort({ createdAt: -1 })
    .limit(Math.min(filters.limit ?? 100, 500));
};
