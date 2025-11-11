import { defHttp } from '/@/utils/http/axios';
import { Modal } from 'ant-design-vue';

export enum Api {
  // 应用管理
  list = '/verto/appmanage/app/list',
  save = '/verto/appmanage/app/add',
  edit = '/verto/appmanage/app/edit',
  delete = '/verto/appmanage/app/delete',
  queryById = '/verto/appmanage/app/queryById',
  batchDelete = '/verto/appmanage/app/deleteBatch',
  // 获取用户列表（用于负责人选择）
  getUserList = '/sys/user/list',
  // 获取领域字典
  getDomainDict = '/sys/dict/getDictItems/app_domain',
  
  // Staff模块接口
  staffList = '/verto/staff/list',
  staffActive = '/verto/staff/active',
  staffQueryById = '/verto/staff/queryById',
  staffAdd = '/verto/staff/add',
  staffEdit = '/verto/staff/edit',
  staffDelete = '/verto/staff/delete',
  staffDeleteBatch = '/verto/staff/deleteBatch',
  
  // 流水线配置相关
  getPipelineConfig = '/verto/appmanage/pipeline/config',
  savePipelineConfig = '/verto/project/pipeline/config/save',
  deletePipelineConfig = '/verto/appmanage/pipeline/config/delete',
  togglePipelineConfig = '/verto/appmanage/pipeline/config/toggle',
  copyPipelineConfig = '/verto/appmanage/pipeline/config/copy',
  
  // 流水线运行历史相关
  getPipelineHistory = '/verto/appmanage/pipeline/history',
  getPipelineHistoryDetail = '/verto/appmanage/pipeline/history/detail',
  rerunPipeline = '/verto/appmanage/pipeline/rerun',
  cancelPipeline = '/verto/appmanage/pipeline/cancel',
  getPipelineLogs = '/verto/appmanage/pipeline/logs',

  // Jenkins 创建流水线 Job（走 project 模块的后端）
  createJenkinsPipeline = '/verto/project/pipeline/jenkins/create',
  // 新增：应用-流水线绑定相关
  bindingList = '/verto/appmanage/pipeline/binding/list',
  bindingSave = '/verto/appmanage/pipeline/binding/save',
  bindingDelete = '/verto/appmanage/pipeline/binding/delete',
  bindingDetail = '/verto/appmanage/pipeline/binding/detail',
  bindingValidate = '/verto/appmanage/pipeline/binding/validate',
  
  // 获取应用 package.json 内容
  getPackageJson = '/verto/appmanage/app/package-json',
  
  // 获取应用统计数据
  getStatistics = '/verto/appmanage/app/statistics',

  // Git 相关（项目仓库创建与权限校验）
  createGitRepo = '/verto/project/git/repo/create',
  checkGitPermission = '/verto/project/git/permission/check',
  // Git 仓库搜索 & 前缀查询
  getGitRepos = '/verto/project/git/repos',
  getGitPrefixes = '/verto/project/git/prefixes',
  // 同步应用的 Git 仓库详细信息并持久化
  syncGitRepoInfo = '/verto/appmanage/app/git/sync',
  // 查询已持久化的 Git 仓库信息（不触发同步）
  getGitRepoInfo = '/verto/appmanage/app/git/info',
}

/**
 * 查询应用列表
 * @param params 查询参数
 */
export const getAppList = (params) => {
  return defHttp.get({ url: Api.list, params }, { isTransformResponse: false });
};

/**
 * 根据应用id查询应用详情
 * @param params 查询参数
 */
export const getAppById = (params) => {
  return defHttp.get({ url: Api.queryById, params }, { isTransformResponse: false });
};

/**
 * 保存应用
 * @param params
 */
export const saveApp = (params) => {
  return defHttp.post({ url: Api.save, params }, { isTransformResponse: false });
};

/**
 * 编辑应用
 * @param params
 */
export const editApp = (params) => {
  return defHttp.put({ url: Api.edit, params }, { isTransformResponse: false });
};

/**
 * 删除应用
 * @param params 删除参数
 * @param handleSuccess 成功回调
 */
export const deleteApp = (params, handleSuccess) => {
  return Modal.confirm({
    title: '确认删除',
    content: '是否删除选中的应用？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      return defHttp.delete({ url: Api.delete, params }, { joinParamsToUrl: true }).then(() => {
        handleSuccess();
      });
    },
  });
};

/**
 * 批量删除应用
 * @param params 删除参数
 * @param handleSuccess 成功回调
 */
export const batchDeleteApp = (params, handleSuccess) => {
  return Modal.confirm({
    title: '确认删除',
    content: '是否删除选中的应用？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      return defHttp.delete({ url: Api.batchDelete, data: params }, { joinParamsToUrl: true }).then(() => {
        handleSuccess();
      });
    },
  });
};

/**
 * 获取用户列表（用于负责人选择）
 * @param params 查询参数
 */
export const getUserList = (params) => {
  return defHttp.get({ url: Api.getUserList, params }, { isTransformResponse: false });
};

/**
 * 获取领域字典数据
 */
export const getDomainDict = () => {
  return defHttp.get({ url: Api.getDomainDict }, { isTransformResponse: false });
};

// ==================== 流水线相关API ====================

/**
 * 获取应用流水线配置
 * @param appId 应用ID
 */
export const getPipelineConfig = (appId: string) => {
  return defHttp.get({ url: Api.getPipelineConfig, params: { appId } }, { isTransformResponse: false });
};

/**
 * 保存流水线配置
 * @param appId 应用ID
 * @param config 配置数据
 */
export const savePipelineConfig = (appId: string, config: any) => {
  return defHttp.post({ url: Api.savePipelineConfig, data: { appId, ...config } });
};

/**
 * 删除流水线配置
 * @param appId 应用ID
 * @param configId 配置ID
 */
export const deletePipelineConfig = (appId: string, configId: string) => {
  return Modal.confirm({
    title: '确认删除',
    content: '是否删除选中的流水线配置？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      return defHttp.delete({ url: Api.deletePipelineConfig, params: { appId, configId } }, { joinParamsToUrl: true });
    },
  });
};

/**
 * 切换流水线配置启用状态
 * @param appId 应用ID
 * @param configId 配置ID
 * @param enabled 是否启用
 */
export const togglePipelineConfig = (appId: string, configId: string, enabled: boolean) => {
  return defHttp.post({ url: Api.togglePipelineConfig, data: { appId, configId, enabled } });
};

/**
 * 复制流水线配置
 * @param appId 应用ID
 * @param configId 配置ID
 * @param newName 新配置名称
 */
export const copyPipelineConfig = (appId: string, configId: string, newName: string) => {
  return defHttp.post({ url: Api.copyPipelineConfig, data: { appId, configId, newName } });
};

/**
 * 获取流水线运行历史
 * @param appId 应用ID
 * @param params 查询参数
 */
export const getPipelineHistory = (appId: string, params: any) => {
  return defHttp.get({ url: Api.getPipelineHistory, params: { appId, ...params } }, { isTransformResponse: false });
};

/**
 * 获取流水线运行历史详情
 * @param appId 应用ID
 * @param historyId 历史记录ID
 */
export const getPipelineHistoryDetail = (appId: string, historyId: string) => {
  return defHttp.get({ url: Api.getPipelineHistoryDetail, params: { appId, historyId } }, { isTransformResponse: false });
};

/**
 * 重新运行流水线
 * @param appId 应用ID
 * @param historyId 历史记录ID
 */
export const rerunPipeline = (appId: string, historyId: string) => {
  return defHttp.post({ url: Api.rerunPipeline, data: { appId, historyId } });
};

/**
 * 取消流水线运行
 * @param appId 应用ID
 * @param historyId 历史记录ID
 */
export const cancelPipeline = (appId: string, historyId: string) => {
  return defHttp.post({ url: Api.cancelPipeline, data: { appId, historyId } });
};

/**
 * 获取流水线运行日志
 * @param appId 应用ID
 * @param historyId 历史记录ID
 */
export const getPipelineLogs = (appId: string, historyId: string) => {
  return defHttp.get({ url: Api.getPipelineLogs, params: { appId, historyId } }, { isTransformResponse: false });
};

/**
 * 获取应用的 package.json 内容
 * @param appId 应用ID
 */
export const getAppPackageJson = (appId: string) => {
  return defHttp.get({ url: Api.getPackageJson, params: { id: appId } }, { isTransformResponse: false });
};

/**
 * 创建 Jenkins 流水线（Job）
 * @param payload 包含 jobName、useScm、repoUrl、branch、credentialsId、jenkinsfilePath、useInlineScript、pipelineScript
 */
export const createJenkinsPipeline = (payload: any) => {
  return defHttp.post({ url: Api.createJenkinsPipeline, data: payload }, { isTransformResponse: false });
};

/**
 * 获取应用统计数据
 * @param appId 应用ID
 */
export const getAppStatistics = (appId: string) => {
  return defHttp.get({ url: Api.getStatistics, params: { id: appId } }, { isTransformResponse: false });
};

// ==================== Git 相关API ====================

/**
 * 创建 Git 仓库（当前支持 GitHub）
 * @param payload 包含 gitUrl、visibility
 */
export const createGitRepo = (payload: any) => {
  return defHttp.post({ url: Api.createGitRepo, data: payload }, { isTransformResponse: false });
};

/**
 * 校验 Git 权限
 * @param params 包含 gitUrl
 */
export const checkGitPermission = (params: any) => {
  return defHttp.get({ url: Api.checkGitPermission, params }, { isTransformResponse: false });
};

/**
 * 搜索当前用户可访问的 Git 仓库（支持关键字查询）
 * @param params { query?: string }
 */
export const getGitRepos = (params: { query?: string }) => {
  return defHttp.get({ url: Api.getGitRepos, params }, { isTransformResponse: false });
};

/**
 * 获取当前用户权限范围内的 Git 前缀（用于新建项目固定前缀）
 */
export const getGitPrefixes = () => {
  return defHttp.get({ url: Api.getGitPrefixes }, { isTransformResponse: false });
};

/**
 * 同步应用的 Git 仓库详细信息并持久化（后续同步为更新）
 * @param appId 应用ID
 */
export const syncGitRepoInfo = (appId: string) => {
  // 将 appId 作为查询参数拼接到 URL，确保后端 @RequestParam 能正确接收
  return defHttp.post(
    { url: Api.syncGitRepoInfo, params: { appId } },
    { isTransformResponse: false, joinParamsToUrl: true },
  );
};

/**
 * 获取应用的 Git 仓库信息（已持久化）
 * @param appId 应用ID
 */
export const getGitRepoInfo = (appId: string) => {
  return defHttp.get({ url: Api.getGitRepoInfo, params: { appId } }, { isTransformResponse: false });
};

// ==================== Staff模块相关API ====================

/**
 * 分页查询人员列表
 * @param params 查询参数
 */
export const getStaffList = (params) => {
  return defHttp.get({ url: Api.staffList, params });
};

/**
 * 获取所有在职人员列表（用于下拉选择）
 * @param params 查询参数
 */
export const getActiveStaffList = (params) => {
  return defHttp.get({ url: Api.staffActive, params });
};

/**
 * 根据ID查询人员详情
 * @param params 查询参数
 */
export const getStaffById = (params) => {
  return defHttp.get({ url: Api.staffQueryById, params });
};

/**
 * 新增人员
 * @param params 人员信息
 */
export const addStaff = (params) => {
  return defHttp.post({ url: Api.staffAdd, params });
};

/**
 * 编辑人员
 * @param params 人员信息
 */
export const editStaff = (params) => {
  return defHttp.put({ url: Api.staffEdit, params });
};

/**
 * 删除人员
 * @param params 删除参数
 */
export const deleteStaff = (params) => {
  return defHttp.delete({ url: Api.staffDelete, params });
};

/**
 * 批量删除人员
 * @param params 删除参数
 */
export const deleteBatchStaff = (params) => {
  return defHttp.delete({ url: Api.staffDeleteBatch, params });
};

// 新增：应用-流水线绑定 API
export const listBindings = (params: { appId: string; environment?: string }) => {
  return defHttp.get({ url: Api.bindingList, params }, { isTransformResponse: false });
};

export const saveBinding = (data: any) => {
  return defHttp.post({ url: Api.bindingSave, data }, { isTransformResponse: false });
};

export const deleteBinding = (id: string) => {
  // 将确认弹框改为返回 Promise，在点击“确认”并完成删除后再 resolve，确保调用方的 await 顺序生效
  return new Promise<void>((resolve, reject) => {
    Modal.confirm({
      title: '确认删除',
      content: '是否删除该绑定？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await defHttp.delete({ url: Api.bindingDelete, params: { id } }, { joinParamsToUrl: true });
          resolve();
        } catch (e) {
          reject(e);
        }
      },
      onCancel: () => resolve(),
    });
  });
};

export const getBindingDetail = (id: string) => {
  return defHttp.get({ url: Api.bindingDetail, params: { id } }, { isTransformResponse: false });
};

export const validateBinding = (jobName: string) => {
  return defHttp.get({ url: Api.bindingValidate, params: { jobName } }, { isTransformResponse: false });
};