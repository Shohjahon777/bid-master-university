'use server'

import { getReports as _getReports, updateReportStatus as _updateReportStatus, resolveReport as _resolveReport } from '../actions'

export async function getReports(status?: Parameters<typeof _getReports>[0]) {
  return await _getReports(status)
}

export async function updateReportStatus(reportId: string, status: Parameters<typeof _updateReportStatus>[1]) {
  return await _updateReportStatus(reportId, status)
}

export async function resolveReport(
  reportId: string,
  action: Parameters<typeof _resolveReport>[1],
  reason: string,
  durationDays?: number
) {
  return await _resolveReport(reportId, action, reason, durationDays)
}
