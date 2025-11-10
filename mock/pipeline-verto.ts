import { MockMethod } from 'vite-plugin-mock';
import { resultError, resultPageSuccess, resultSuccess } from './_util';

/**
 * 基于 verto_ 表结构的 流水线定义与运行 Mock 接口
 * Base Prefix: /verto-backend
 *
 * 涵盖表：
 * - verto_pipeline（流水线定义，绑定到应用）
 * - verto_project_pipeline（项目-流水线绑定与历史记录，可简化为运行记录）
 */

type PipelineItem = {
  id: string;
  applicationId: string; // 绑定应用（verto_pipeline.app_id）
  name: string;
  description?: string;
  enabled: boolean;
  autoTrigger?: boolean;
  environments?: any[]; // 简化结构，参考现有 mock
  createTime: string;
  updateTime?: string;
};

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

// 构建记录（简化模拟 verto_project_pipeline 运行历史）
type BuildRecord = {
  id: string;
  pipelineId: string;
  number: number;
  status: 'queued' | 'running' | 'success' | 'failed';
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

// 运行中状态（一个 pipeline 同时仅模拟一个当前运行）
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

const baseRoutes: MockMethod[] = [
  /** 列出应用下的流水线（verto_pipeline） */
  {
    url: '/verto/pipeline/list',
    method: 'get',
    response: ({ query }) => {
      const { applicationId, pageNo = 1, pageSize = 10 } = query || {};
      const list = pipelinesByAppId[String(applicationId)] || [];
      return resultPageSuccess(Number(pageNo), Number(pageSize), list);
    },
  },

  /** 查询流水线详情 */
  {
    url: '/verto/pipeline/queryById',
    method: 'get',
    response: ({ query }) => {
      const { id } = query || {};
      const all = Object.values(pipelinesByAppId).flat();
      const pl = all.find((p) => p.id === String(id));
      if (!pl) return resultError('流水线不存在');
      return resultSuccess(pl);
    },
  },

  /** 新增流水线 */
  {
    url: '/verto/pipeline/add',
    method: 'post',
    response: ({ body }) => {
      const { applicationId, name, description, enabled = true, autoTrigger = false, environments = [] } = body || {};
      if (!applicationId || !name) return resultError('applicationId/name 不能为空');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const pl: PipelineItem = {
        id: `pl_${Date.now()}`,
        applicationId: String(applicationId),
        name: String(name),
        description,
        enabled: !!enabled,
        autoTrigger: !!autoTrigger,
        environments,
        createTime: now,
        updateTime: now,
      };
      pipelinesByAppId[pl.applicationId] = pipelinesByAppId[pl.applicationId] || [];
      pipelinesByAppId[pl.applicationId].unshift(pl);
      return resultSuccess(pl);
    },
  },

  /** 编辑流水线 */
  {
    url: '/verto/pipeline/edit',
    method: 'put',
    response: ({ body }) => {
      const { id } = body || {};
      const appId = String(body?.applicationId || '');
      const list = appId ? pipelinesByAppId[appId] || [] : Object.values(pipelinesByAppId).flat();
      const idx = list.findIndex((p) => p.id === String(id));
      if (idx < 0) return resultError('流水线不存在');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      list[idx] = { ...list[idx], ...body, updateTime: now };
      // 写回（若使用 flat 搜索，需要根据 applicationId 写回原数组）
      const targetAppId = list[idx].applicationId;
      const originList = pipelinesByAppId[targetAppId] || [];
      const originIdx = originList.findIndex((p) => p.id === String(id));
      if (originIdx >= 0) originList[originIdx] = list[idx];
      return resultSuccess('编辑成功');
    },
  },

  /** 删除流水线 */
  {
    url: '/verto/pipeline/delete',
    method: 'delete',
    response: ({ query }) => {
      const { id } = query || {};
      const allAppIds = Object.keys(pipelinesByAppId);
      for (const appId of allAppIds) {
        const idx = (pipelinesByAppId[appId] || []).findIndex((p) => p.id === String(id));
        if (idx >= 0) {
          pipelinesByAppId[appId].splice(idx, 1);
          delete buildHistoryByPipelineId[String(id)];
          runningStatusByPipelineId[String(id)] = null;
          return resultSuccess('删除成功');
        }
      }
      return resultError('流水线不存在');
    },
  },

  /** 触发运行（新建构建记录为 queued->running） */
  {
    url: '/verto/pipeline/run',
    method: 'post',
    response: ({ body }) => {
      const { pipelineId, branch = 'develop', author = 'system' } = body || {};
      if (!pipelineId) return resultError('pipelineId 不能为空');
      const all = Object.values(pipelinesByAppId).flat();
      const pl = all.find((p) => p.id === String(pipelineId));
      if (!pl) return resultError('流水线不存在');
      const now = new Date().toLocaleString('zh-CN');
      const build: BuildRecord = {
        id: `build_${pipelineId}_${Date.now()}`,
        pipelineId: String(pipelineId),
        number: (buildHistoryByPipelineId[pipelineId]?.[0]?.number || 0) + 1,
        status: 'running',
        startTime: now,
        branch,
        commitId: Math.random().toString(36).slice(2, 10),
        commitMessage: 'trigger: 手动触发构建',
        author,
        currentStage: 'build',
        progress: 5,
      };
      runningStatusByPipelineId[pipelineId] = build;
      buildHistoryByPipelineId[pipelineId] = buildHistoryByPipelineId[pipelineId] || [];
      buildHistoryByPipelineId[pipelineId].unshift(build);
      return resultSuccess({ buildId: build.id, pipelineId });
    },
  },

  /** 获取运行状态 */
  {
    url: '/verto/pipeline/status',
    method: 'get',
    response: ({ query }) => {
      const { pipelineId } = query || {};
      const status = runningStatusByPipelineId[String(pipelineId)] || null;
      const isRunning = !!status && status.status === 'running';
      return resultSuccess({ pipelineId, isRunning, currentBuild: status });
    },
  },

  /** 构建历史 */
  {
    url: '/verto/pipeline/history',
    method: 'get',
    response: ({ query }) => {
      const { pipelineId, pageNo = 1, pageSize = 10 } = query || {};
      const list = buildHistoryByPipelineId[String(pipelineId)] || [];
      return resultPageSuccess(Number(pageNo), Number(pageSize), list);
    },
  },

  /** 构建详情 */
  {
    url: '/verto/pipeline/build/detail',
    method: 'get',
    response: ({ query }) => {
      const { buildId } = query || {};
      const all = Object.values(buildHistoryByPipelineId).flat();
      const rec = all.find((b) => b.id === String(buildId));
      if (!rec) return resultError('构建不存在');
      // 模拟阶段信息
      const stages = [
        { name: 'build', status: 'success', duration: 300 },
        { name: 'test', status: 'success', duration: 200 },
        { name: 'deploy', status: rec.status === 'success' ? 'success' : 'skipped', duration: rec.status === 'success' ? 400 : 0 },
      ];
      return resultSuccess({ ...rec, stages });
    },
  },

  /** 下载构建日志（模拟文本） */
  {
    url: '/verto/pipeline/build/logs/download',
    method: 'get',
    response: ({ query }) => {
      const { buildId } = query || {};
      const content = `=== 构建日志 ${buildId} ===\n[日志内容...]\n`;
      return resultSuccess({ filename: `logs_${buildId}.txt`, content, size: content.length });
    },
  },

  /** 对比构建 */
  {
    url: '/verto/pipeline/build/compare',
    method: 'post',
    response: ({ body }) => {
      const { pipelineId, buildIds } = body || {};
      if (!pipelineId || !buildIds || !Array.isArray(buildIds) || buildIds.length < 2) {
        return resultError('pipelineId 或 buildIds 不合法');
      }
      return resultSuccess({
        pipelineId,
        buildIds,
        differences: [
          { category: '代码变更', items: [{ type: 'modified', file: 'src/app.ts', lines: '+12 -4' }] },
          { category: '构建时间', items: [{ stage: 'build', build1: '2分30秒', build2: '2分45秒', difference: '+15秒' }] },
        ],
      });
    },
  },

  /** 删除构建（历史记录中移除） */
  {
    url: '/verto/pipeline/build/delete',
    method: 'delete',
    response: ({ query }) => {
      const { buildId } = query || {};
      for (const [pid, list] of Object.entries(buildHistoryByPipelineId)) {
        const idx = list.findIndex((b) => b.id === String(buildId));
        if (idx >= 0) {
          list.splice(idx, 1);
          if (runningStatusByPipelineId[pid]?.id === String(buildId)) {
            runningStatusByPipelineId[pid] = null;
          }
          return resultSuccess('删除成功');
        }
      }
      return resultError('构建不存在');
    },
  },
];

// 生成 /jeecgboot 前缀别名，以及去掉 /verto 前缀的兼容路由
const aliasRoutes: MockMethod[] = [];
baseRoutes.forEach((r) => {
  const url = r.url as any;
  if (typeof url === 'string') {
    aliasRoutes.push({ ...r, url: '/jeecgboot' + url } as MockMethod);
    if (url.startsWith('/verto')) {
      const stripped = url.replace(/^\/verto/, '');
      aliasRoutes.push({ ...r, url: stripped } as MockMethod);
      aliasRoutes.push({ ...r, url: '/jeecgboot' + stripped } as MockMethod);
    }
  } else if (url instanceof RegExp) {
    aliasRoutes.push({ ...r, url: new RegExp('/jeecgboot' + url.source) } as MockMethod);
  }
});

export default [...baseRoutes, ...aliasRoutes] as MockMethod[];