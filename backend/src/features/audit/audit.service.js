const AuditLog = require('./auditLog.model');

/**
 * Append a record to the audit trail. Fire-and-forget safe: failures are logged
 * but never bubble up to break the calling business flow.
 *
 * @param {Object} opts
 * @param {string} opts.action       - machine-readable action key
 * @param {string} [opts.userId]     - the customer the action concerns
 * @param {string} [opts.bookingId]  - the booking the action concerns
 * @param {string} [opts.performedBy]- the acting user (omit/null for system actions)
 * @param {string} [opts.notes]      - human-readable description
 * @param {Object} [opts.meta]       - structured context
 * @returns {Promise<void>}
 */
const logAudit = async ({ action, userId = null, bookingId = null, performedBy = null, notes = '', meta = null }) => {
  try {
    await AuditLog.create({ action, userId, bookingId, performedBy, notes, meta });
  } catch (err) {
    console.error(`⚠️  Audit log write failed [${action}]:`, err.message);
  }
};

module.exports = { logAudit };
