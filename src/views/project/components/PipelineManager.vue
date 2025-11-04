<template>
  <div class="pipeline-manager">
    <a-card :bordered="false" class="pm-card">
      <!-- 流水线步骤（横向 Steps） -->
      <div class="pm-steps">
        <a-steps :current="currentStep" size="small">
          <a-step title="分支合并" />
          <a-step title="审核" />
          <a-step title="构建" />
          <a-step title="完成" />
        </a-steps>
        <!-- 步骤操作区：根据当前节点显示不同的提示与操作按钮 -->
        <div class="pm-step-panel">
          <template v-if="currentStep === 0">
            <div class="pm-step-row">
              <span class="pm-step-tip">当前节点：分支合并。请完成代码合并或选择分支后，进入审核。</span>
              <div class="pm-step-actions">
                <a-button type="primary" @click="onMergeComplete">模拟分支合并完成</a-button>
                <a-button class="ml8" @click="resetFlow">重置流程</a-button>
              </div>
            </div>
          </template>
          <template v-else-if="currentStep === 1">
            <div class="pm-step-row">
              <span class="pm-step-tip">当前节点：审核。将向应用负责人发送审核通知，负责人审核通过后进入构建。</span>
              <div class="pm-step-actions">
                <a-button @click="sendReviewNotification" :disabled="notificationSent">{{ notificationSent ? '已发送通知' : '发送审核通知' }}</a-button>
                <a-button type="primary" class="ml8" @click="reviewApproved">审核通过</a-button>
                <a-button class="ml8" @click="resetFlow">重置流程</a-button>
              </div>
            </div>
            <div v-if="lastNotificationText" class="pm-note">{{ lastNotificationText }}</div>
          </template>
          <template v-else-if="currentStep === 2">
            <div class="pm-step-row">
              <span class="pm-step-tip">当前节点：构建。系统将自动触发构建与发布，完成后进入“完成”节点。</span>
              <div class="pm-step-actions">
                <a-button type="primary" :loading="buildInProgress" @click="startBuild">{{ buildInProgress ? '构建中...' : '开始构建（模拟）' }}</a-button>
                <a-button class="ml8" @click="resetFlow" :disabled="buildInProgress">重置流程</a-button>
              </div>
            </div>
            <div v-if="buildInProgress" class="pm-note">已触发模拟 Jenkins 流水线，等待构建完成...</div>
          </template>
          <template v-else>
            <div class="pm-step-row">
              <span class="pm-step-tip">流程已完成。可以查看构建历史与日志。</span>
              <div class="pm-step-actions">
                <a-button type="primary" @click="loadHistory">刷新历史</a-button>
                <a-button class="ml8" @click="resetFlow">重置流程</a-button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="pm-actions">
        <a-button type="primary" @click="openReleaseDrawer">
          新建发布
        </a-button>
        <a-button class="ml8" @click="loadHistory" :loading="historyLoading">
          刷新历史
        </a-button>
      </div>

      <a-table
        class="pm-table"
        :data-source="pipelineHistory"
        :columns="historyColumns"
        :loading="historyLoading"
        row-key="buildId"
        :pagination="{ pageSize: 10 }"
      />
    </a-card>

    <a-drawer
      :visible="releaseVisible"
      :width="520"
      title="新建发布"
      @close="closeReleaseDrawer"
      destroyOnClose
    >
      <a-form layout="vertical">
        <a-form-item label="环境">
          <a-select v-model:value="releaseForm.environment" :options="environmentOptions" @change="onEnvChange" />
        </a-form-item>
        <!-- 新增：绑定已有 Jenkins 流水线 -->
        <a-form-item label="选择流水线">
          <a-select
            v-model:value="releaseForm.bindingId"
            :options="bindingOptions"
            :loading="bindingLoading"
            placeholder="选择已绑定的 Jenkins 流水线"
            allow-clear
            show-search
          />
        </a-form-item>
        <a-form-item label="分支">
          <a-select
            v-model:value="releaseForm.branch"
            :options="branchOptions"
            :loading="branchesLoading"
            placeholder="请选择分支"
            @change="onBranchChange"
          />
        </a-form-item>
        <a-form-item label="提交ID">
          <a-select
            v-model:value="releaseForm.commitId"
            :options="commitOptions"
            :loading="commitsLoading"
            placeholder="请选择提交ID（随分支变化）"
            :disabled="!releaseForm.branch"
            show-search
            :filter-option="true"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="releaseForm.remark" :rows="3" placeholder="本次发布说明" />
        </a-form-item>
        <div class="pm-drawer-actions">
          <a-button @click="closeReleaseDrawer">取消</a-button>
          <a-button type="primary" class="ml8" :loading="releaseSubmitting" @click="submitRelease">
            提交发布
          </a-button>
        </div>
      </a-form>
    </a-drawer>
    <a-modal :visible="logsVisible" title="构建日志" @cancel="() => (logsVisible = false)" :footer="null" width="800px">
      <a-spin :spinning="logsLoading">
        <pre class="pm-logs">{{ logsText }}</pre>
      </a-spin>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, h } from 'vue';
import { useMessage } from '/@/hooks/web/useMessage';
import { formatToDateTime } from '/@/utils/dateUtil';
import { getPipelineHistory, triggerPipeline, retryBuild, getBuildLogs, getGitBranches, getGitCommits, getProjectDetail } from '../Project.api';
import { getPipelineConfig as getAppPipelineConfig, listBindings } from '/@/views/appmanage/AppManage.api';
import { Button } from '/@/components/Button';

const props = defineProps<{ projectId: string | number; appId?: string | number }>();

const { createMessage } = useMessage();

// Steps 状态（0:分支合并, 1:审核, 2:构建, 3:完成）
const currentStep = ref<number>(0);
const notificationSent = ref<boolean>(false);
const lastNotificationText = ref<string>('');
const buildInProgress = ref<boolean>(false);
let buildTimer: any = null;

function resetFlow() {
  if (buildTimer) {
    clearTimeout(buildTimer);
    buildTimer = null;
  }
  currentStep.value = 0;
  notificationSent.value = false;
  lastNotificationText.value = '';
  buildInProgress.value = false;
}

function onMergeComplete() {
  // 这里可结合分支选择（releaseForm.branch）进行校验，这里用 mock 简化
  if (!releaseForm.branch) {
    createMessage.warning('请先选择分支（在下方新建发布中可选择分支），再模拟合并完成');
    return;
  }
  createMessage.success('分支合并完成，进入审核节点');
  currentStep.value = 1;
}

function sendReviewNotification() {
  notificationSent.value = true;
  const appId = (props.appId ?? getAppIdFromProject(projectInfo.value)) as string | number | undefined;
  // 简单模拟：向应用负责人发送通知（实际可从应用详情中读取负责人列表）
  lastNotificationText.value = `已向应用${appId ? `(${appId})` : ''}负责人发送审核通知：请在平台内点击“审核通过”进入构建。`;
  createMessage.info('已发送审核通知');
}

function reviewApproved() {
  if (!notificationSent.value) {
    // 未发送通知也允许直接通过，用于演示
    createMessage.warning('未发送通知，直接进入构建（演示）');
  }
  currentStep.value = 2;
  // 进入构建后自动开始模拟构建
  startBuild();
}

function startBuild() {
  if (buildInProgress.value) return;
  buildInProgress.value = true;
  createMessage.loading({ content: '已触发构建与发布（模拟）', duration: 1 });
  // 可选：调用真实触发接口（使用 mock 环境），此处演示忽略失败
  try {
    const payload: any = {
      projectId: String(props.projectId || ''),
      environment: releaseForm.environment,
      branch: releaseForm.branch || undefined,
      commitId: releaseForm.commitId || undefined,
      parameters: {
        version: releaseForm.version || generateReleaseVersion(),
        remark: releaseForm.remark || 'Steps 构建演示',
        pipelineConfigId: releaseForm.pipelineConfigId || undefined,
      },
    };
    if (releaseForm.bindingId) payload.bindingId = releaseForm.bindingId;
    // 触发真实接口（若 mock 已配置则成功返回）
    triggerPipeline(payload).catch(() => void 0);
  } catch (e) {}
  // 模拟 Jenkins 完成：3.5s 后跳转到完成
  buildTimer = setTimeout(() => {
    buildInProgress.value = false;
    currentStep.value = 3;
    createMessage.success('Jenkins 流水线完成，流程已进入“完成”节点');
    // 完成后刷新一次历史，便于演示
    loadHistory();
  }, 3500);
}

onBeforeUnmount(() => {
  if (buildTimer) clearTimeout(buildTimer);
});

// 历史列表
const historyLoading = ref(false);
const pipelineHistory = ref<any[]>([]);
const historyColumns = [
  { title: '构建ID', dataIndex: 'buildId', key: 'buildId' },
  { title: '环境', dataIndex: 'environment', key: 'environment' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '分支', dataIndex: 'branch', key: 'branch' },
  { title: '提交ID', dataIndex: 'commitId', key: 'commitId' },
  { title: '时间', dataIndex: 'createTime', key: 'createTime',
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-') },
  { title: '操作', key: 'action',
    customRender: ({ record }: any) => {
      return h('div', { class: 'pm-actions-cell' }, [
        h(
          Button,
          { size: 'small', color: 'warning', onClick: () => handleRetryBuild(record) },
          { default: () => '重新构建' }
        ),
        h(
          Button,
          { size: 'small', class: 'ml8', onClick: () => handleViewLogs(record) },
          { default: () => '查看日志' }
        ),
      ]);
    }
  },
];

async function loadHistory() {
  if (!props.projectId) return;
  try {
    historyLoading.value = true;
    const res: any = await getPipelineHistory({ projectId: String(props.projectId), page: 1, pageSize: 10 });
    const list = Array.isArray(res?.records) ? res.records : (Array.isArray(res) ? res : []);
    pipelineHistory.value = list || [];
  } catch (e) {
    console.warn('加载流水线历史失败:', e);
  } finally {
    historyLoading.value = false;
  }
}

// 新建发布
const releaseVisible = ref(false);
const releaseSubmitting = ref(false);
const environmentOptions = [
  { label: '开发环境', value: 'dev' },
  { label: '测试环境', value: 'test' },
  { label: '生产环境', value: 'prod' },
];

const releaseForm = reactive({
  environment: 'dev',
  version: '',
  branch: '',
  commitId: '',
  remark: '',
  pipelineConfigId: '',
  // 新增：绑定ID
  bindingId: '',
});

function pad(n: number) { return String(n).padStart(2, '0'); }
function generateReleaseVersion() {
  const d = new Date();
  return `v${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function openReleaseDrawer() {
  releaseForm.environment = 'dev';
  releaseForm.version = generateReleaseVersion();
  // 设定默认分支为项目基础信息中的分支
  if (projectInfo.value?.gitBranch) {
    releaseForm.branch = projectInfo.value.gitBranch;
    // 加载该分支的提交列表
    onBranchChange(projectInfo.value.gitBranch);
  }
  // 加载必要选择项
  loadBranches();
  // 根据项目关联的应用，加载流水线配置
  loadPipelineConfigsByProject();
  // 新增：根据应用+环境加载绑定列表
  loadBindingsByEnv();
  releaseVisible.value = true;
}

function closeReleaseDrawer() {
  releaseVisible.value = false;
}

async function submitRelease() {
  if (!props.projectId) return;
  try {
    releaseSubmitting.value = true;
    const payload: any = {
      projectId: String(props.projectId),
      environment: releaseForm.environment,
      branch: releaseForm.branch || undefined,
      commitId: releaseForm.commitId || undefined,
      parameters: {
        version: releaseForm.version,
        remark: releaseForm.remark,
        pipelineConfigId: releaseForm.pipelineConfigId || undefined,
      },
    };
    // 新增：选择了绑定则传递 bindingId
    if (releaseForm.bindingId) {
      payload.bindingId = releaseForm.bindingId;
    }
    await triggerPipeline(payload);
    createMessage.success('已触发发布流程');
    releaseVisible.value = false;
    await loadHistory();
  } catch (e: any) {
    console.error('触发发布失败:', e);
    createMessage.error(e?.message || '触发发布失败');
  } finally {
    releaseSubmitting.value = false;
  }
}

// 项目基础信息（关联应用、默认分支）
const projectInfo = ref<any>(null);

async function loadProjectInfo() {
  if (!props.projectId) return;
  try {
    // 修正参数名：后端要求传入 id，而非 projectId
    const info: any = await getProjectDetail({ id: String(props.projectId) });
    projectInfo.value = info?.result || info || null;
  } catch (e) {
    console.warn('获取项目基础信息失败:', e);
  }
}

onMounted(async () => {
  await loadProjectInfo();
  await loadHistory();
});

const pipelineConfigOptions = ref<{ label: string; value: string }[]>([]);

async function loadPipelineConfigsByProject() {
  releaseForm.pipelineConfigId = '';
  pipelineConfigOptions.value = [];
  // 优先使用父组件传入的 appId，其次再从项目详情中推断
  const appId = (props.appId ?? getAppIdFromProject(projectInfo.value)) as string | number | undefined;
  if (!appId) {
    console.warn('项目未找到关联的应用ID，无法加载流水线配置');
    return;
  }
  try {
    const resp: any = await getAppPipelineConfig(String(appId));
    // 兼容多种响应结构
    const list = resp?.result || resp?.data || resp?.records || resp?.list || resp;
    const pipelines: any[] = Array.isArray(list) ? list : (Array.isArray(list?.pipelines) ? list.pipelines : []);
    pipelineConfigOptions.value = (pipelines || []).map((p: any) => ({ label: p?.pipelineName || p?.name || p?.id, value: String(p?.id || p?.pipelineId || p?.name) }));
  } catch (e) {
    console.warn('获取应用流水线配置失败:', e);
  }
}

function getAppIdFromProject(project: any): string | undefined {
  if (!project) return undefined;
  return (
    project.appId || project.app_id || project.appCode || project.app?.id || project.app?.appId || project.appIdRef || project.applicationId || undefined
  );
}

// 分支 & 提交ID
const branchesLoading = ref(false);
const commitList = ref<any[]>([]);
const commitsLoading = ref(false);
const branchOptions = ref<{ label: string; value: string }[]>([]);
const commitOptions = computed(() => (commitList.value || []).map((c: any) => ({ label: `${c?.shortId || c?.id || c} ${c?.message ? '- ' + c.message : ''}`, value: String(c?.id || c) })));

async function loadBranches() {
  if (!props.projectId) return;
  try {
    branchesLoading.value = true;
    const res: any = await getGitBranches({ projectId: String(props.projectId) });
    const arr = Array.isArray(res) ? res : (Array.isArray(res?.records) ? res.records : []);
    branchOptions.value = (arr || []).map((b: any) => ({ label: b?.name || b, value: String(b?.name || b) }));
  } catch (e) {
    console.warn('获取分支失败:', e);
    // 同步给用户提示，便于排查
    try { createMessage?.error('获取分支失败，请检查后端接口 /project/git/branches 和项目ID'); } catch {}
  } finally {
    branchesLoading.value = false;
  }
}

async function onBranchChange(branch: string) {
  releaseForm.commitId = '';
  await loadCommits(branch);
}

async function loadCommits(branch?: string) {
  // 优先使用后端Git提交接口获取提交列表
  try {
    commitsLoading.value = true;
    const res: any = await getGitCommits({ projectId: String(props.projectId), branch, page: 1, pageSize: 50 });
    const arr = Array.isArray(res) ? res : (Array.isArray(res?.records) ? res.records : []);
    const commits = (arr || []).map((c: any) => ({
      id: c?.id || c?.sha || c,
      shortId: (c?.shortId || c?.id || c?.sha || '').toString().slice(0, 8),
      message: c?.message || c?.commitMessage || '',
    }));
    // 兼容：若后端返回为空，回退到从流水线历史中提取
    if (!commits.length) {
      const history: any = await getPipelineHistory({ projectId: String(props.projectId), page: 1, pageSize: 50, branch });
      const list = Array.isArray(history?.records) ? history.records : (Array.isArray(history) ? history : []);
      const histCommits = (list || [])
        .filter((i: any) => (!branch || i?.branch === branch) && !!i?.commitId)
        .map((i: any) => ({ id: i.commitId, shortId: String(i.commitId).slice(0, 8), message: i.commitMessage || '' }));
      const uniq: Record<string, any> = {};
      histCommits.forEach((c) => { if (!uniq[c.id]) uniq[c.id] = c; });
      commitList.value = Object.values(uniq);
    } else {
      commitList.value = commits;
    }
  } catch (e) {
    console.warn('获取提交列表失败:', e);
  } finally {
    commitsLoading.value = false;
  }
}

// 历史操作：重试与日志
const logsVisible = ref(false);
const logsLoading = ref(false);
const logsText = ref('');

async function handleRetryBuild(record: any) {
  try {
    if (!record?.buildId) return;
    await retryBuild({ projectId: String(props.projectId), buildId: String(record.buildId) });
    createMessage.success('已重新触发构建');
    await loadHistory();
  } catch (e: any) {
    createMessage.error(e?.message || '重新构建失败');
  }
}

async function handleViewLogs(record: any) {
  logsVisible.value = true;
  logsText.value = '';
  try {
    logsLoading.value = true;
    if (!record?.buildId) return;
    const res: any = await getBuildLogs({ projectId: String(props.projectId), buildId: String(record.buildId) });
    logsText.value = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
  } catch (e) {
    logsText.value = '获取日志失败';
  } finally {
    logsLoading.value = false;
  }
}
// 新增：绑定列表
const bindingOptions = ref<{ label: string; value: string }[]>([]);
const bindingLoading = ref(false);

function onEnvChange() {
  // 环境改变时刷新绑定列表
  loadBindingsByEnv();
}

async function loadBindingsByEnv() {
  bindingOptions.value = [];
  const appId = (props.appId ?? getAppIdFromProject(projectInfo.value)) as string | number | undefined;
  if (!appId || !releaseForm.environment) return;
  try {
    bindingLoading.value = true;
    const resp: any = await listBindings({ appId: String(appId), environment: releaseForm.environment });
    const list = Array.isArray(resp?.result) ? resp.result : Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
    bindingOptions.value = (list || []).map((b: any) => ({
      label: `${b.jobName || b.name || b.id} (${b.environment || releaseForm.environment})`,
      value: String(b.id),
    }));
  } catch (e) {
    console.warn('加载绑定列表失败:', e);
  } finally {
    bindingLoading.value = false;
  }
}
</script>

<style scoped>
.pm-card {
  margin-top: 8px;
}
.pm-steps {
  margin-bottom: 12px;
}
.pm-step-panel {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f7f8fa;
  border: 1px solid #eceef1;
  border-radius: 6px;
}
.pm-step-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pm-step-tip {
  color: #333;
  font-size: 13px;
}
.pm-step-actions {
  display: flex;
  align-items: center;
}
.pm-actions {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.ml8 { margin-left: 8px; }
.pm-table :deep(.ant-table) {
  font-size: 13px;
}
.pm-drawer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.pm-logs {
  background: #0b1022;
  color: #d2d6ef;
  padding: 12px;
  border-radius: 6px;
  min-height: 300px;
  white-space: pre-wrap;
}
.pm-note {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
</style>