'use strict';

const crypto = require('crypto');
const eventBus = require('../../utils/eventBus');
const config = require('../../config/risk.config');

/** @type {Map<string, import('../../models').IssueReport>} */
const reports = new Map();

const CRITICAL_TYPES = new Set(['road_damage', 'low_lighting']);

/**
 * Check whether an incoming report is a duplicate of an existing open report.
 * A duplicate is defined as: same type + same zoneId within deduplicationWindowMs.
 *
 * @param {import('../../models').IssueReport} report
 * @returns {boolean}
 */
function deduplicateReport(report) {
  const now = Date.now();
  const windowMs = config.deduplicationWindowMs;

  for (const existing of reports.values()) {
    if (
      existing.type === report.type &&
      existing.zoneId === report.zoneId &&
      existing.status !== 'resolved' &&
      now - new Date(existing.timestamp).getTime() < windowMs
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Log an escalation notice for critical issue types.
 *
 * @param {import('../../models').IssueReport} report
 */
function escalateIfCritical(report) {
  if (!CRITICAL_TYPES.has(report.type)) return;

  const timestamp = new Date().toISOString();
  console.log(
    `[ESCALATION][${timestamp}] Critical issue detected — type: ${report.type}, ` +
    `zoneId: ${report.zoneId}, reportId: ${report.id}, ` +
    `escalationWindowMs: ${config.escalationWindowMs}`
  );
}

/**
 * Create a new IssueReport. Deduplicates before storing.
 * Emits 'issue:created' on the EventBus if the report is new.
 *
 * @param {Omit<import('../../models').IssueReport, 'id'|'status'>} report
 * @returns {import('../../models').IssueReport | { deduplicated: true }}
 */
function createReport(report) {
  if (deduplicateReport(report)) {
    return { deduplicated: true };
  }

  /** @type {import('../../models').IssueReport} */
  const stored = {
    ...report,
    id: crypto.randomUUID(),
    status: 'open',
    resolvedAt: report.resolvedAt ?? null,
  };

  reports.set(stored.id, stored);

  eventBus.emit('issue:created', {
    reportId: stored.id,
    zoneId: stored.zoneId,
    type: stored.type,
  });

  escalateIfCritical(stored);

  return stored;
}

/**
 * Mark a report as resolved and emit 'issue:resolved'.
 *
 * @param {string} reportId
 * @returns {import('../../models').IssueReport}
 * @throws {Error} REPORT_NOT_FOUND if the reportId does not exist
 */
function resolveReport(reportId) {
  const report = reports.get(reportId);
  if (!report) {
    const err = new Error(`Report with id '${reportId}' does not exist`);
    err.code = 'REPORT_NOT_FOUND';
    throw err;
  }

  report.status = 'resolved';
  report.resolvedAt = new Date().toISOString();

  eventBus.emit('issue:resolved', {
    reportId: report.id,
    zoneId: report.zoneId,
  });

  return report;
}

/**
 * Retrieve reports matching the given filter criteria.
 *
 * @param {{ zoneId?: string, type?: string, status?: string, from?: number, to?: number }} [filter={}]
 * @returns {import('../../models').IssueReport[]}
 */
function getReports(filter = {}) {
  const { zoneId, type, status, from, to } = filter;

  return Array.from(reports.values()).filter((r) => {
    if (zoneId !== undefined && r.zoneId !== zoneId) return false;
    if (type !== undefined && r.type !== type) return false;
    if (status !== undefined && r.status !== status) return false;

    const ts = new Date(r.timestamp).getTime();
    if (from !== undefined && ts < from) return false;
    if (to !== undefined && ts > to) return false;

    return true;
  });
}

module.exports = {
  createReport,
  resolveReport,
  getReports,
  deduplicateReport,
  escalateIfCritical,
};
