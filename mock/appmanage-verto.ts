import { MockMethod } from 'vite-plugin-mock';
import { resultError, resultPageSuccess, resultSuccess } from './_util';

/**
 * 基于 verto_ 表结构的 应用管理 + 模板绑定 + 管理员关系 Mock 接口
 * Base Prefix: /verto-backend
 *
 * 涵盖表：
 * - verto_application
 * - verto_application_staff_manager（应用-人员多对多：管理员）
 * - verto_material_template（模板）
 * - verto_application_template_relation（应用-模板一对一）
 */

// 应用列表（模拟 verto_application）
type ApplicationItem = {
  id: string;
  appName: string;
  appCode: string;
  appType: 'WEB' | 'API' | 'MOBILE' | 'OTHER';
  status: 'DEVELOPMENT' | 'TESTING' | 'PRODUCTION' | 'DISABLED';
  description?: string;
  gitUrl?: string;
  createTime: string;
  updateTime?: string;
};

const applicationList: ApplicationItem[] = [
  {
    id: 'app_1_1',
    appName: '智能办公前端',
    appCode: 'SMART_OFFICE_WEB',
    appType: 'WEB',
    status: 'PRODUCTION',
    description: '智能办公系统前端应用',
    gitUrl: 'https://github.com/company/smart-office-web.git',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 16:30:00',
  },
  {
    id: 'app_1_2',
    appName: '智能办公API',
    appCode: 'SMART_OFFICE_API',
    appType: 'API',
    status: 'PRODUCTION',
    description: '智能办公系统后端API',
    gitUrl: 'https://github.com/company/smart-office-api.git',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 16:30:00',
  },
  {
    id: 'app_2_1',
    appName: '电商前端',
    appCode: 'ECOMMERCE_WEB',
    appType: 'WEB',
    status: 'TESTING',
    description: '电商平台前端应用',
    gitUrl: 'https://github.com/company/ecommerce-web.git',
    createTime: '2024-02-01 09:00:00',
    updateTime: '2024-02-15 14:20:00',
  },
  {
    id: 'app_3_1',
    appName: '移动端APP',
    appCode: 'MOBILE_APP_NATIVE',
    appType: 'MOBILE',
    status: 'DEVELOPMENT',
    description: '企业级移动端原生应用',
    gitUrl: 'https://github.com/company/mobile-app.git',
    createTime: '2024-03-01 08:30:00',
    updateTime: '2024-03-10 11:45:00',
  },
];

// 应用管理员关系（模拟 verto_application_staff_manager）
// key: applicationId, value: staffId[]
const appManagers: Record<string, string[]> = {
  'app_1_1': ['2', '4'], // 李四(前端)、赵六(项目经理)
  'app_1_2': ['1', '7'], // 张三(后端)、吴九(DevOps)
  'app_2_1': ['2'],
  'app_3_1': ['14'],
};

// 模板列表（模拟 verto_material_template）
type TemplateItem = {
  id: string;
  templateName: string;
  templateCode: string;
  version?: string;
  authorStaffId?: string; // 关联 verto_staff
  description?: string;
  createTime: string;
};

const templateList: TemplateItem[] = [
  {
    id: 'tpl_001',
    templateName: '基础前端模板',
    templateCode: 'BASE_WEB_TPL',
    version: '1.0.0',
    authorStaffId: '2',
    description: '用于Web应用的基础前端模板',
    createTime: '2024-01-05 10:00:00',
  },
  {
    id: 'tpl_002',
    templateName: 'API服务模板',
    templateCode: 'BASE_API_TPL',
    version: '1.1.0',
    authorStaffId: '1',
    description: '用于后端API服务的基础模板',
    createTime: '2024-01-06 11:00:00',
  },
];

// 应用-模板一对一关系（模拟 verto_application_template_relation）
// key: applicationId, value: templateId
const appTemplateRelation: Record<string, string | undefined> = {
  'app_1_1': 'tpl_001',
  'app_1_2': 'tpl_002',
  'app_2_1': undefined,
  'app_3_1': undefined,
};

export default [
  /**
   * 应用列表
   */
  {
    url: '/verto-backend/application/list',
    method: 'get',
    response: ({ query }) => {
      const { pageNo = 1, pageSize = 10, keyword } = query || {};
      let list = applicationList.slice();
      if (keyword) {
        const kw = String(keyword).toLowerCase();
        list = list.filter(
          (a) =>
            a.appName.toLowerCase().includes(kw) ||
            a.appCode.toLowerCase().includes(kw) ||
            (a.description || '').toLowerCase().includes(kw)
        );
      }
      return resultPageSuccess(Number(pageNo), Number(pageSize), list);
    },
  },

  /**
   * 查询应用详情
   */
  {
    url: '/verto-backend/application/queryById',
    method: 'get',
    response: ({ query }) => {
      const { id } = query || {};
      const app = applicationList.find((a) => a.id === String(id));
      if (!app) return resultError('应用不存在');
      const managers = appManagers[app.id] || [];
      return resultSuccess({ ...app, managers });
    },
  },

  /**
   * 新增应用
   */
  {
    url: '/verto-backend/application/add',
    method: 'post',
    response: ({ body }) => {
      const {
        appName,
        appCode,
        appType = 'OTHER',
        status = 'DEVELOPMENT',
        description,
        gitUrl,
      } = body || {};
      if (!appName || !appCode) return resultError('appName/appCode 不能为空');
      if (applicationList.find((a) => a.appCode === String(appCode))) {
        return resultError('appCode 已存在');
      }
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const newApp: ApplicationItem = {
        id: `app_${Date.now()}`,
        appName: String(appName),
        appCode: String(appCode),
        appType: String(appType) as any,
        status: String(status) as any,
        description,
        gitUrl,
        createTime: now,
        updateTime: now,
      };
      applicationList.unshift(newApp);
      return resultSuccess(newApp);
    },
  },

  /**
   * 编辑应用
   */
  {
    url: '/verto-backend/application/edit',
    method: 'put',
    response: ({ body }) => {
      const { id } = body || {};
      const idx = applicationList.findIndex((a) => a.id === String(id));
      if (idx < 0) return resultError('应用不存在');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      applicationList[idx] = { ...applicationList[idx], ...body, updateTime: now };
      return resultSuccess('编辑成功');
    },
  },

  /**
   * 删除应用
   */
  {
    url: '/verto-backend/application/delete',
    method: 'delete',
    response: ({ query }) => {
      const { id } = query || {};
      const idx = applicationList.findIndex((a) => a.id === String(id));
      if (idx < 0) return resultError('应用不存在');
      const appId = applicationList[idx].id;
      applicationList.splice(idx, 1);
      // 清理关系
      delete appManagers[appId];
      delete appTemplateRelation[appId];
      return resultSuccess('删除成功');
    },
  },

  /**
   * 应用管理员列表（verto_application_staff_manager）
   */
  {
    url: '/verto-backend/application/managers/list',
    method: 'get',
    response: ({ query }) => {
      const { applicationId } = query || {};
      const managers = appManagers[String(applicationId)] || [];
      return resultSuccess({ applicationId, managers });
    },
  },

  /**
   * 绑定应用管理员（支持批量）
   */
  {
    url: '/verto-backend/application/managers/bind',
    method: 'post',
    response: ({ body }) => {
      const { applicationId, staffIds = [] } = body || {};
      if (!applicationId) return resultError('applicationId 不能为空');
      const appId = String(applicationId);
      appManagers[appId] = appManagers[appId] || [];
      const set = new Set(appManagers[appId]);
      (staffIds as string[]).forEach((id) => set.add(String(id)));
      appManagers[appId] = Array.from(set);
      return resultSuccess({ applicationId: appId, managers: appManagers[appId] });
    },
  },

  /**
   * 解绑应用管理员（支持批量）
   */
  {
    url: '/verto-backend/application/managers/unbind',
    method: 'post',
    response: ({ body }) => {
      const { applicationId, staffIds = [] } = body || {};
      if (!applicationId) return resultError('applicationId 不能为空');
      const appId = String(applicationId);
      const toRemove = new Set((staffIds as string[]).map(String));
      appManagers[appId] = (appManagers[appId] || []).filter((id) => !toRemove.has(String(id)));
      return resultSuccess({ applicationId: appId, managers: appManagers[appId] || [] });
    },
  },

  /**
   * 查询应用绑定的模板（一对一）
   */
  {
    url: '/verto-backend/application/template/query',
    method: 'get',
    response: ({ query }) => {
      const { applicationId } = query || {};
      const tplId = appTemplateRelation[String(applicationId)];
      const tpl = templateList.find((t) => t.id === tplId);
      return resultSuccess({ applicationId, template: tpl || null });
    },
  },

  /**
   * 绑定模板（一对一），若已有绑定则覆盖
   */
  {
    url: '/verto-backend/application/template/bind',
    method: 'post',
    response: ({ body }) => {
      const { applicationId, templateId } = body || {};
      if (!applicationId || !templateId) return resultError('applicationId/templateId 不能为空');
      const tpl = templateList.find((t) => t.id === String(templateId));
      if (!tpl) return resultError('模板不存在');
      appTemplateRelation[String(applicationId)] = String(templateId);
      return resultSuccess({ applicationId, template: tpl });
    },
  },

  /**
   * 解绑模板（一对一）
   */
  {
    url: '/verto-backend/application/template/unbind',
    method: 'post',
    response: ({ body }) => {
      const { applicationId } = body || {};
      if (!applicationId) return resultError('applicationId 不能为空');
      const appId = String(applicationId);
      delete appTemplateRelation[appId];
      return resultSuccess({ applicationId: appId, template: null });
    },
  },
] as MockMethod[];