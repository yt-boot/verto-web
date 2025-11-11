import { defHttp } from '/@/utils/http/axios';

/**
 * 积分管理（独立）API 枚举 — 专用于 views/points 下的独立页面
 * 后端接口位于 jeecg-boot-module/jeecg-module-verto 中的 PointsController
 */
enum Api {
  staffList = '/verto/points/staff/list',
  pointsSummary = '/verto/points/summary',
  pointsLogs = '/verto/points/logs',
  pointsLogsAll = '/verto/points/logs/all',
  pointsAdjust = '/verto/points/adjust',
}

/**
 * 获取人员列表（用于 ApiSelect）
 */
export const getStaffList = (params?: Record<string, any>) =>
  defHttp.get({ url: Api.staffList, params });

/**
 * 获取某人员的积分总和
 */
export const getStaffPointsSummary = (staffId: string) =>
  defHttp.get({ url: Api.pointsSummary, params: { staffId } });

/**
 * 获取某人员积分流水
 */
export const getStaffPointsLogs = (staffId: string, params?: Record<string, any>) =>
  defHttp.get({ url: Api.pointsLogs, params: { staffId, ...(params || {}) } });

/**
 * 获取全员积分流水（可筛选）
 */
export const getAllStaffPointsLogs = (params?: Record<string, any>) =>
  defHttp.get({ url: Api.pointsLogsAll, params: { ...(params || {}) } });

/**
 * 调整人员积分
 */
export const adjustStaffPoints = (
  staffId: string,
  delta: number,
  remark?: string,
  source?: { sourceType?: string; sourceId?: string; eventType?: string }
) => defHttp.post({ url: Api.pointsAdjust, params: { staffId, delta, remark, ...(source || {}) } });