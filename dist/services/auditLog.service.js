"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditLogs = exports.logAction = void 0;
const auditLog_model_1 = require("../models/auditLog.model");
/**
 * Records an administrative action for the audit trail (spec section 23).
 * Deliberately swallows its own errors and logs to stderr instead of
 * throwing: an audit-log write failing must never roll back or block the
 * real business action (e.g. a hire, a verification, a suspension).
 */
const logAction = async (input) => {
    try {
        await auditLog_model_1.AuditLog.create({
            actor: input.actor,
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId,
            metadata: input.metadata,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("⚠️  Failed to write audit log entry:", input.action, error);
    }
};
exports.logAction = logAction;
const listAuditLogs = async (filters = {}) => {
    const query = {};
    if (filters.targetType)
        query.targetType = filters.targetType;
    if (filters.targetId)
        query.targetId = filters.targetId;
    return auditLog_model_1.AuditLog.find(query)
        .populate("actor", "fullName email role")
        .sort({ createdAt: -1 })
        .limit(Math.min(filters.limit ?? 100, 500));
};
exports.listAuditLogs = listAuditLogs;
//# sourceMappingURL=auditLog.service.js.map