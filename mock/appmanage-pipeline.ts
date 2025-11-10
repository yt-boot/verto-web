import { MockMethod } from 'vite-plugin-mock';
import { resultError, resultPageSuccess, resultSuccess } from './_util';

/**
 * AppManage 页面所需的流水线相关 Mock（前端期望路径：/verto/appmanage/pipeline/*）
 *
 * 说明：此文件复用 pipeline-verto.ts 内的设计思路，按应用ID维护流水线配置与历史。
 */

type PipelineItem = {
  id: string;
  applicationId: string; // 对应应用ID
  name: string;
  description?: string;
  enabled: boolean;
  autoTrigger?: boolean;
  environments?: any[];
  createTime: string;
  updateTime?: string;
};

// 应用下的流水线配置（示例数据与 pipeline-verto.ts 保持一致风格）
const pipelinesByAppId: Record<string, PipelineItem[]> = {
  'app_1_1': [
    {
      id: 'pl_1',
      applicationId: 'app_1_1',
      name: 'Web前端CI/CD',
      description: '前端构建、测试、部署到测试/生产环境',
      enabled: true,
      autoTrigger: true,
      environments: [
        { name: 'test', stages: ['git_merge', 'build', 'test', 'deploy'] },
        { name: 'prod', stages: ['git_merge', 'build', 'test', 'deploy'] },
      ],
      createTime: '2024-08-20 10:00:00',
      updateTime: '2024-08-25 15:30:00',
    },
  ],
  'app_1_2': [
    {
      id: 'pl_2',
      applicationId: 'app_1_2',
      name: 'API服务CI/CD',
      description: '后端API构建/测试/部署',
      enabled: true,
      autoTrigger: true,
      environments: [
        { name: 'test', stages: ['build', 'test', 'deploy'] },
        { name: 'prod', stages: ['build', 'test', 'deploy'] },
      ],
      createTime: '2024-08-22 14:00:00',
      updateTime: '2024-08-24 16:45:00',
    },
  ],
  'app_2_1': [
    {
      id: 'pl_3',
      applicationId: 'app_2_1',
      name: '电商前端流水线',
      description: '电商平台前端CI/CD',
      enabled: true,
      autoTrigger: false,
      environments: [{ name: 'test', stages: ['build', 'test', 'deploy'] }],
      createTime: '2024-08-25 09:30:00',
    },
  ],
  'app_3_1': [],
};

type BuildRecord = {
  id: string;
  pipelineId: string;
  number: number;
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  duration?: number;
  branch?: string;
  commitId?: string;
  commitMessage?: string;
  author?: string;
  currentStage?: string;
  progress?: number;
};

const buildHistoryByPipelineId: Record<string, BuildRecord[]> = {
  pl_1: [
    {
      id: 'pl1_b15',
      pipelineId: 'pl_1',
      number: 15,
      status: 'success',
      startTime: '2024-01-15 14:30:00',
      endTime: '2024-01-15 14:45:00',
      duration: 900,
      branch: 'main',
      commitId: 'abc123def456',
      commitMessage: 'feat: 添加新功能模块',
      author: 'zhangsan',
    },
  ],
  pl_2: [
    {
      id: 'pl2_b7',
      pipelineId: 'pl_2',
      number: 7,
      status: 'failed',
      startTime: '2024-02-14 10:15:00',
      endTime: '2024-02-14 10:28:00',
      duration: 780,
      branch: 'develop',
      commitId: 'ghi789jkl012',
      commitMessage: 'refactor: 重构订单服务',
      author: 'lisi',
    },
  ],
  pl_3: [],
};

const runningStatusByPipelineId: Record<string, BuildRecord | null> = {
  pl_1: null,
  pl_2: {
    id: 'pl2_b8',
    pipelineId: 'pl_2',
    number: 8,
    status: 'running',
    startTime: '2024-02-15 16:20:00',
    branch: 'develop',
    commitId: 'def456ghi789',
    commitMessage: 'fix: 修复支付模块bug',
    author: 'lisi',
    currentStage: 'test',
    progress: 65,
  },
  pl_3: null,
};

// 绑定关系：应用与 Jenkins Job/流水线的绑定
type BindingItem = {
  id: string;
  appId: string;
  environment: string; // test/prod
  jobName: string; // Jenkins Job 名称
  pipelineId?: string; // 可选：对应本地定义的流水线
  enabled: boolean;
  createdAt: string;
  remark?: string;
  jobUrl?: string;
};

const pipelineBindingsByAppId: Record<string, BindingItem[]> = {
  'app_1_1': [
    {
      id: 'bind_1',
      appId: 'app_1_1',
      environment: 'test',
      jobName: 'SMART_OFFICE_WEB_TEST',
      pipelineId: 'pl_1',
      enabled: true,
      createdAt: '2024-01-10 09:00:00',
      remark: '前端测试环境流水线',
      jobUrl: 'https://jenkins.company.local/job/SMART_OFFICE_WEB_TEST/',
    },
    {
      id: 'bind_3',
      appId: 'app_1_1',
      environment: 'prod',
      jobName: 'SMART_OFFICE_WEB_PROD',
      pipelineId: 'pl_1',
      enabled: true,
      createdAt: '2024-01-18 10:20:00',
      remark: '前端生产环境流水线',
      jobUrl: 'https://jenkins.company.local/job/SMART_OFFICE_WEB_PROD/',
    },
  ],
  'app_1_2': [
    {
      id: 'bind_2',
      appId: 'app_1_2',
      environment: 'prod',
      jobName: 'SMART_OFFICE_API_PROD',
      pipelineId: 'pl_2',
      enabled: true,
      createdAt: '2024-02-12 13:30:00',
      remark: '后端生产环境流水线',
      jobUrl: 'https://jenkins.company.local/job/SMART_OFFICE_API_PROD/',
    },
    {
      id: 'bind_4',
      appId: 'app_1_2',
      environment: 'test',
      jobName: 'SMART_OFFICE_API_TEST',
      pipelineId: 'pl_2',
      enabled: true,
      createdAt: '2024-02-05 09:45:00',
      remark: '后端测试环境流水线',
      jobUrl: 'https://jenkins.company.local/job/SMART_OFFICE_API_TEST/',
    },
  ],
  'app_2_1': [
    {
      id: 'bind_5',
      appId: 'app_2_1',
      environment: 'test',
      jobName: 'ECOMMERCE_WEB_TEST',
      pipelineId: 'pl_3',
      enabled: true,
      createdAt: '2024-03-02 11:00:00',
      remark: '电商前端测试环境流水线',
      jobUrl: 'https://jenkins.company.local/job/ECOMMERCE_WEB_TEST/',
    },
    {
      id: 'bind_6',
      appId: 'app_2_1',
      environment: 'prod',
      jobName: 'ECOMMERCE_WEB_PROD',
      pipelineId: 'pl_3',
      enabled: true,
      createdAt: '2024-03-10 09:20:00',
      remark: '电商前端生产环境流水线',
      jobUrl: 'https://jenkins.company.local/job/ECOMMERCE_WEB_PROD/',
    },
  ],
  'app_3_1': [
    {
      id: 'bind_7',
      appId: 'app_3_1',
      environment: 'test',
      jobName: 'MOBILE_APP_BUILD_TEST',
      pipelineId: undefined,
      enabled: true,
      createdAt: '2024-04-08 15:30:00',
      remark: '移动端APP测试构建流水线',
      jobUrl: 'https://jenkins.company.local/job/MOBILE_APP_BUILD_TEST/',
    },
    {
      id: 'bind_8',
      appId: 'app_3_1',
      environment: 'prod',
      jobName: 'MOBILE_APP_BUILD_PROD',
      pipelineId: undefined,
      enabled: true,
      createdAt: '2024-04-15 10:10:00',
      remark: '移动端APP生产构建流水线',
      jobUrl: 'https://jenkins.company.local/job/MOBILE_APP_BUILD_PROD/',
    },
  ],
  'app_4_1': [
    {
      id: 'bind_9',
      appId: 'app_4_1',
      environment: 'test',
      jobName: 'DATA_ANALYTICS_WEB_TEST',
      pipelineId: undefined,
      enabled: true,
      createdAt: '2024-05-02 09:40:00',
      remark: '数据分析平台测试流水线',
      jobUrl: 'https://jenkins.company.local/job/DATA_ANALYTICS_WEB_TEST/',
    },
    {
      id: 'bind_10',
      appId: 'app_4_1',
      environment: 'prod',
      jobName: 'DATA_ANALYTICS_WEB_PROD',
      pipelineId: undefined,
      enabled: true,
      createdAt: '2024-05-10 11:20:00',
      remark: '数据分析平台生产流水线',
      jobUrl: 'https://jenkins.company.local/job/DATA_ANALYTICS_WEB_PROD/',
    },
  ],
};

const baseRoutes: MockMethod[] = [
  // 获取应用流水线配置列表（按 AppId 返回绑定的流水线定义）
  {
    url: '/verto/appmanage/pipeline/config',
    method: 'get',
    response: ({ query }) => {
      const { appId, pageNo = 1, pageSize = 10 } = query || {};
      const list = pipelinesByAppId[String(appId)] || [];
      return resultPageSuccess(Number(pageNo), Number(pageSize), list);
    },
  },

  // 删除流水线配置
  {
    url: '/verto/appmanage/pipeline/config/delete',
    method: 'delete',
    response: ({ query }) => {
      const { appId, configId } = query || {};
      const arr = pipelinesByAppId[String(appId)] || [];
      const idx = arr.findIndex((p) => p.id === String(configId));
      if (idx < 0) return resultError('配置不存在');
      arr.splice(idx, 1);
      delete buildHistoryByPipelineId[String(configId)];
      runningStatusByPipelineId[String(configId)] = null;
      return resultSuccess('删除成功');
    },
  },

  // 切换流水线配置启用状态
  {
    url: '/verto/appmanage/pipeline/config/toggle',
    method: 'post',
    response: ({ body }) => {
      const { appId, configId, enabled } = body || {};
      const arr = pipelinesByAppId[String(appId)] || [];
      const pl = arr.find((p) => p.id === String(configId));
      if (!pl) return resultError('配置不存在');
      pl.enabled = !!enabled;
      pl.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      return resultSuccess('切换成功');
    },
  },

  // 复制流水线配置
  {
    url: '/verto/appmanage/pipeline/config/copy',
    method: 'post',
    response: ({ body }) => {
      const { appId, configId, newName } = body || {};
      const arr = pipelinesByAppId[String(appId)] || [];
      const pl = arr.find((p) => p.id === String(configId));
      if (!pl) return resultError('配置不存在');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const newPl: PipelineItem = {
        ...pl,
        id: `pl_${Date.now()}`,
        name: String(newName || pl.name + '_copy'),
        createTime: now,
        updateTime: now,
      };
      arr.unshift(newPl);
      return resultSuccess(newPl);
    },
  },

  // 获取流水线运行历史（按 AppId 合并该 App 绑定的所有流水线历史）
  {
    url: '/verto/appmanage/pipeline/history',
    method: 'get',
    response: ({ query }) => {
      const { appId, pageNo = 1, pageSize = 10 } = query || {};
      const pipelines = pipelinesByAppId[String(appId)] || [];
      const list = pipelines
        .map((p) => buildHistoryByPipelineId[p.id] || [])
        .flat();
      return resultPageSuccess(Number(pageNo), Number(pageSize), list);
    },
  },

  // 获取流水线运行历史详情
  {
    url: '/verto/appmanage/pipeline/history/detail',
    method: 'get',
    response: ({ query }) => {
      const { historyId } = query || {};
      const all = Object.values(buildHistoryByPipelineId).flat();
      const rec = all.find((b) => b.id === String(historyId));
      if (!rec) return resultError('历史记录不存在');
      const stages = [
        { name: 'build', status: 'success', duration: 300 },
        { name: 'test', status: rec.status === 'failed' ? 'failed' : 'success', duration: 200 },
        { name: 'deploy', status: rec.status === 'success' ? 'success' : 'cancelled', duration: rec.status === 'success' ? 400 : 0 },
      ];
      return resultSuccess({ ...rec, stages });
    },
  },

  // 重新运行流水线
  {
    url: '/verto/appmanage/pipeline/rerun',
    method: 'post',
    response: ({ body }) => {
      const { appId, historyId } = body || {};
      const all = Object.values(buildHistoryByPipelineId).flat();
      const oldRec = all.find((b) => b.id === String(historyId));
      if (!oldRec) return resultError('历史记录不存在');
      const pipelineId = oldRec.pipelineId;
      const now = new Date().toLocaleString('zh-CN');
      const build: BuildRecord = {
        id: `build_${pipelineId}_${Date.now()}`,
        pipelineId,
        number: (buildHistoryByPipelineId[pipelineId]?.[0]?.number || 0) + 1,
        status: 'running',
        startTime: now,
        branch: oldRec.branch || 'develop',
        commitId: Math.random().toString(36).slice(2, 10),
        commitMessage: 'rerun: 重新触发构建',
        author: oldRec.author || 'system',
        currentStage: 'build',
        progress: 5,
      };
      runningStatusByPipelineId[pipelineId] = build;
      buildHistoryByPipelineId[pipelineId] = buildHistoryByPipelineId[pipelineId] || [];
      buildHistoryByPipelineId[pipelineId].unshift(build);
      return resultSuccess({ buildId: build.id, pipelineId, appId });
    },
  },

  // 取消流水线运行
  {
    url: '/verto/appmanage/pipeline/cancel',
    method: 'post',
    response: ({ body }) => {
      const { appId, historyId } = body || {};
      const all = Object.values(buildHistoryByPipelineId).flat();
      const rec = all.find((b) => b.id === String(historyId));
      if (!rec) return resultError('历史记录不存在');
      rec.status = 'cancelled';
      rec.endTime = new Date().toLocaleString('zh-CN');
      rec.duration = rec.startTime ? Math.floor((Date.now() - new Date(rec.startTime).getTime()) / 1000) : 0;
      // 若当前运行就是该记录，则置空
      const pid = rec.pipelineId;
      if (runningStatusByPipelineId[pid]?.id === rec.id) {
        runningStatusByPipelineId[pid] = null;
      }
      return resultSuccess({ cancelled: true, appId, historyId });
    },
  },

  // 获取流水线运行日志
  {
    url: '/verto/appmanage/pipeline/logs',
    method: 'get',
    response: ({ query }) => {
      const { appId, historyId } = query || {};
      const content = `=== 应用(${appId}) 构建日志 ${historyId} ===\n[阶段] build -> test -> deploy\n[日志内容...]\n`;
      return resultSuccess({ filename: `logs_${historyId}.txt`, content, size: content.length });
    },
  },

  // 应用-流水线绑定：列表
  {
    url: '/verto/appmanage/pipeline/binding/list',
    method: 'get',
    response: ({ query }) => {
      const { appId, environment } = query || {};
      let list = pipelineBindingsByAppId[String(appId)] || [];
      if (environment) list = list.filter((b) => b.environment === String(environment));
      return resultSuccess(list);
    },
  },

  // 应用-流水线绑定：保存（新增/编辑）
  {
    url: '/verto/appmanage/pipeline/binding/save',
    method: 'post',
    response: ({ body }) => {
      const { id, appId, environment, jobName, pipelineId, enabled = true, remark, jobUrl } = body || {};
      if (!appId || !environment || !jobName) return resultError('appId/environment/jobName 不能为空');
      const arr = (pipelineBindingsByAppId[String(appId)] = pipelineBindingsByAppId[String(appId)] || []);
      if (id) {
        const idx = arr.findIndex((b) => b.id === String(id));
        if (idx < 0) return resultError('绑定不存在');
        arr[idx] = { ...arr[idx], environment, jobName, pipelineId, enabled, remark, jobUrl };
        return resultSuccess(arr[idx]);
      }
      const newItem: BindingItem = {
        id: `bind_${Date.now()}`,
        appId: String(appId),
        environment: String(environment),
        jobName: String(jobName),
        pipelineId: pipelineId ? String(pipelineId) : undefined,
        enabled: !!enabled,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        remark: remark ? String(remark) : undefined,
        jobUrl: jobUrl ? String(jobUrl) : undefined,
      };
      arr.unshift(newItem);
      return resultSuccess(newItem);
    },
  },

  // 应用-流水线绑定：删除
  {
    url: '/verto/appmanage/pipeline/binding/delete',
    method: 'delete',
    response: ({ query }) => {
      const { id } = query || {};
      for (const [appId, arr] of Object.entries(pipelineBindingsByAppId)) {
        const idx = arr.findIndex((b) => b.id === String(id));
        if (idx >= 0) {
          arr.splice(idx, 1);
          return resultSuccess('删除成功');
        }
      }
      return resultError('绑定不存在');
    },
  },

  // 应用-流水线绑定：详情
  {
    url: '/verto/appmanage/pipeline/binding/detail',
    method: 'get',
    response: ({ query }) => {
      const { id } = query || {};
      for (const arr of Object.values(pipelineBindingsByAppId)) {
        const item = arr.find((b) => b.id === String(id));
        if (item) return resultSuccess(item);
      }
      return resultError('绑定不存在');
    },
  },

  // 应用-流水线绑定：校验（jobName 是否已存在）
  {
    url: '/verto/appmanage/pipeline/binding/validate',
    method: 'get',
    response: ({ query }) => {
      const { jobName } = query || {};
      const exists = Object.values(pipelineBindingsByAppId)
        .flat()
        .some((b) => b.jobName === String(jobName));
      return resultSuccess({ jobName, valid: !exists });
    },
  },
];

// 补充多种别名，确保通过不同前缀发起的请求也能命中 mock：
// 1) /jeecgboot + 原始url（/jeecgboot/verto/...）
// 2) 去掉 /verto 前缀的等价 url（/appmanage/...）
// 3) /jeecgboot + 去掉 /verto 前缀的 url（/jeecgboot/appmanage/...）
const aliasRoutes: MockMethod[] = [];
baseRoutes.forEach((r) => {
  const url = r.url as any;
  if (typeof url === 'string') {
    // 1) /jeecgboot + 原始url
    aliasRoutes.push({ ...r, url: '/jeecgboot' + url } as MockMethod);

    // 如果以 /verto 开头，构造去掉 /verto 的两种别名
    if (url.startsWith('/verto')) {
      const stripped = url.replace(/^\/verto/, '');
      // 2) 去掉 /verto 前缀
      aliasRoutes.push({ ...r, url: stripped } as MockMethod);
      // 3) /jeecgboot + 去掉 /verto 前缀
      aliasRoutes.push({ ...r, url: '/jeecgboot' + stripped } as MockMethod);
    }
  } else if (url instanceof RegExp) {
    // 1) /jeecgboot + 原始正则
    aliasRoutes.push({ ...r, url: new RegExp('/jeecgboot' + url.source) } as MockMethod);
    // 2/3) 正则无法可靠处理前缀剥离，这里不做更多别名
  }
});

export default [...baseRoutes, ...aliasRoutes] as MockMethod[];