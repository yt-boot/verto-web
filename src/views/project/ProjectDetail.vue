<template>
  <div class="project-detail">
    <PageWrapper dense contentFullHeight fixedHeight contentClass="flex content-white">
      <template #headerContent>
        <div class="project-header">
          <div class="project-title">
            <h2>{{ projectData?.title || '项目详情' }}</h2>
            <div class="project-meta">
              <a-tag :color="getProjectTypeColor(projectData?.projectType)">
                {{ getProjectTypeText(projectData?.projectType) }}
              </a-tag>
              <span class="project-id">
                {{ projectData?.requirementId || projectData?.bugId || '' }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <a-tabs v-model:activeKey="activeTab" type="card" class="project-tabs">
        <!-- 基本信息 -->
        <a-tab-pane key="basic" tab="基本信息">
          <div class="tab-content">
            <a-descriptions :column="2" bordered>
              <a-descriptions-item label="项目类型">
                <a-tag :color="getProjectTypeColor(projectData?.projectType)">
                  {{ getProjectTypeText(projectData?.projectType) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="需求/BUG ID">
                {{ projectData?.requirementId || projectData?.bugId || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="项目描述" :span="2">
                {{ projectData?.description || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="关联应用">
                {{ projectData?.relatedAppName || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="开发人员">
                {{ projectData?.developerName || '-' }}
              </a-descriptions-item>

              <a-descriptions-item label="Git分支">
                {{ projectData?.gitBranch || '-' }}
              </a-descriptions-item>

              <!-- 展示绑定的应用流水线链接 -->
              <a-descriptions-item label="绑定流水线" :span="2">
                <div v-if="boundPipeline">
                  <div>
                    已绑定：
                    <a :href="boundPipeline.jobUrl" target="_blank">{{ boundPipeline.jobName }}</a>
                    <span v-if="boundPipeline.environment">（{{ boundPipeline.environment }}）</span>
                  </div>
                  <div v-if="boundPipeline.remark" style="margin-top: 8px; color: #999">备注：{{ boundPipeline.remark }}</div>
                </div>
                <div v-else>暂无绑定流水线</div>
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </a-tab-pane>

        <!-- 流水线 -->
        <!-- 仅保留新建发布与流水线历史，由 PipelineManager 统一承载 -->

        <!-- <a-tab-pane key="pipeline" tab="流水线" v-if="!props.hidePipelineTab">
          <div class="tab-content">
            <div class="pipeline-manager">
              <PipelineManager :project-id="projectId" :app-id="projectData?.relatedAppId" />
            </div>
          </div>
        </a-tab-pane> -->
      </a-tabs>
    </PageWrapper>

    <!-- 项目编辑模态框 -->
    <ProjectModal @register="registerModal" @success="handleEditSuccess" />

    <!-- Git分支创建结果模态框 -->
    <BasicModal v-model:visible="gitBranchModalVisible" title="Git分支创建结果" :footer="null" width="600px">
      <div class="git-branch-result">
        <a-result
          :status="gitBranchResult.success ? 'success' : 'error'"
          :title="gitBranchResult.success ? '分支创建成功' : '分支创建失败'"
          :sub-title="gitBranchResult.message"
        >
          <template #extra v-if="gitBranchResult.success">
            <div class="git-command">
              <h4>Git命令：</h4>
              <a-typography-paragraph copyable>
                {{ gitBranchResult.command }}
              </a-typography-paragraph>
            </div>
          </template>
        </a-result>
      </div>
    </BasicModal>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch, onMounted, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { PageWrapper } from '/@/components/Page';
  import { BasicModal, useModal } from '/@/components/Modal';
  import { Icon } from '/@/components/Icon';
  import { useMessage } from '/@/hooks/web/useMessage';
  import {} from './Project.api';
  import { getProjectDetail, createGitBranch, generateGitBranchName } from './Project.api';
  import { ProjectModel, ProjectType, ProjectStatus } from './Project.data';
  import ProjectModal from './components/ProjectModal.vue';

  import PipelineManager from './components/PipelineManager.vue';
  import { formatToDateTime } from '/@/utils/dateUtil';

  // 允许通过属性传入 projectId，并可选择隐藏流水线Tab（用于抽屉展示）
  const props = defineProps<{ projectId?: string; hidePipelineTab?: boolean }>();

  const route = useRoute();
  const router = useRouter();
  const { createMessage } = useMessage();

  // 项目ID：优先使用外部传入的 props.projectId，其次使用路由参数
  const projectId = computed(() => (props.projectId as string) || (route.params?.id as string));

  // 项目数据
  const projectData = ref<ProjectModel>();

  // 绑定应用的流水线数据（从 /verto/appmanage/pipeline/binding/list 获取用于回退解析）
  type BindingItem = { id?: string | number; jobName: string; remark?: string; jobUrl?: string; environment?: string };
  const pipelineOptions = ref<BindingItem[]>([]);
  const selectedBindingId = ref<string | number | undefined>(undefined);
  const boundPipeline = computed<BindingItem | null>(() => {
    const cfg: any = projectData.value?.appConfig;
    let appCfg = cfg;
    if (typeof appCfg === 'string') {
      try {
        appCfg = JSON.parse(appCfg);
      } catch (e) {
        appCfg = {};
      }
    }
    // 1) 首选后端保存的绑定信息
    if (appCfg && appCfg.pipelineBinding) {
      const binding = appCfg.pipelineBinding as BindingItem;
      // 如果仅保存了 id，补全显示信息
      if (binding && binding.id && (!binding.jobName || !binding.jobUrl)) {
        const found = pipelineOptions.value.find((b) => String(b.id) === String(binding.id));
        return found ? { ...found, ...binding } : binding;
      }
      return binding;
    }
    // 2) 回退到本地存储的选择
    const storageKey = getSelectionStorageKey(projectId.value);
    const savedId = storageKey ? localStorage.getItem(storageKey) : null;
    if (savedId) {
      const found = pipelineOptions.value.find((b) => String(b.id) === String(savedId));
      return found || null;
    }
    return null;
  });

  function getSelectionStorageKey(pid?: string) {
    return pid ? `projectPipelineSelection:${pid}` : '';
  }

  // 当前激活的标签页
  const activeTab = ref('basic');

  // 加载状态
  const loading = ref(false);
  const gitBranchLoading = ref(false);

  // Git分支创建结果
  const gitBranchModalVisible = ref(false);
  const gitBranchResult = reactive({
    success: false,
    message: '',
    command: '',
    branchName: '',
  });

  // 注册模态框
  const [registerModal, { openModal }] = useModal();

  /**
   * 加载项目详情
   */
  async function loadProjectDetail() {
    if (!projectId.value) return;

    try {
      loading.value = true;
      const result = await getProjectDetail({ id: projectId.value });
      // 设计链接为字符串时解析为数组，保证页面渲染正常
      let designLinks: any = result?.designLinks;
      if (typeof designLinks === 'string') {
        try {
          designLinks = JSON.parse(designLinks);
        } catch (e) {
          designLinks = [];
        }
      }
      if (!Array.isArray(designLinks)) {
        designLinks = [];
      }
      result.designLinks = designLinks;
      // 解析 appConfig 字段（如为字符串）
      let appCfg: any = result?.appConfig;
      if (typeof appCfg === 'string') {
        try {
          appCfg = JSON.parse(appCfg);
        } catch (e) {
          appCfg = {};
        }
      }
      result.appConfig = appCfg;
      projectData.value = result;
    } catch (error) {
      createMessage.error('加载项目详情失败');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载绑定的流水线列表（不指定 environment，获取全部环境）
   */
  async function loadBindings() {
    if (!projectData.value?.relatedAppId) return;
    try {
      const { defHttp } = await import('/@/utils/http/axios');
      const res = await defHttp.get({
        url: '/verto/appmanage/pipeline/binding/list',
        params: { appId: projectData.value.relatedAppId },
      });
      pipelineOptions.value = Array.isArray(res?.records) ? res.records : [];
      // 恢复本地选择
      const storageKey = getSelectionStorageKey(projectId.value);
      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          selectedBindingId.value = saved;
        }
      }
    } catch (e) {
      pipelineOptions.value = [];
    }
  }

  function openSelectedPipeline() {
    const binding = boundPipeline.value;
    if (binding?.jobUrl) {
      window.open(binding.jobUrl, '_blank');
    } else {
      createMessage.warning('当前绑定的流水线没有可跳转的链接');
    }
  }

  /**
   * 返回列表
   */
  function goBack() {
    router.push('/project/list');
  }

  /**
   * 编辑项目
   */
  function handleEdit() {
    // 跳转到独立的编辑页面
    router.push(`/project/edit/${route.params.id}`);
  }

  /**
   * 创建Git分支
   */
  // async function handleCreateGitBranch() {
  //   if (!projectData.value) return;

  //   try {
  //     gitBranchLoading.value = true;
  //     const itemId = projectData.value.requirementId || projectData.value.bugId;
  //     if (!itemId) {
  //       createMessage.error('需求ID或BUG ID不能为空');
  //       return;
  //     }

  //     const result = await createGitBranch({
  //       projectId: projectId.value,
  //       projectType: projectData.value.projectType,
  //       itemId,
  //       appId: projectData.value.relatedAppId,
  //     });

  //     gitBranchResult.success = result.success;
  //     gitBranchResult.message = result.message;
  //     gitBranchResult.command = result.command;
  //     gitBranchResult.branchName = result.branchName;
  //     gitBranchModalVisible.value = true;

  //     if (result.success) {
  //       // 更新项目数据中的Git分支信息
  //       projectData.value.gitBranch = result.branchName;
  //     }
  //   } catch (error) {
  //     createMessage.error('创建Git分支失败');
  //   } finally {
  //     gitBranchLoading.value = false;
  //   }
  // }

  // 已移除：项目管理页内的触发流水线逻辑，统一由 PipelineManager 承载

  /**
   * 编辑成功回调
   */
  function handleEditSuccess() {
    loadProjectDetail();
  }

  /**
   * 获取项目类型颜色
   */
  function getProjectTypeColor(type?: ProjectType) {
    return type === ProjectType.REQUIREMENT ? 'blue' : 'red';
  }

  /**
   * 获取项目类型文本
   */
  function getProjectTypeText(type?: ProjectType) {
    return type === ProjectType.REQUIREMENT ? '需求' : 'BUG';
  }

  /**
   * 获取项目状态颜色
   */
  function getProjectStatusColor(status?: ProjectStatus) {
    const colorMap = {
      [ProjectStatus.PLANNING]: 'default',
      [ProjectStatus.DEVELOPING]: 'processing',
      [ProjectStatus.TESTING]: 'warning',
      [ProjectStatus.ONLINE]: 'success',
      [ProjectStatus.RELEASED]: 'success',
      [ProjectStatus.CLOSED]: 'default',
    };
    return colorMap[status!] || 'default';
  }

  /**
   * 获取项目状态文本
   */
  function getProjectStatusText(status?: ProjectStatus) {
    const textMap = {
      [ProjectStatus.PLANNING]: '规划中',
      [ProjectStatus.DEVELOPING]: '开发中',
      [ProjectStatus.TESTING]: '测试中',
      [ProjectStatus.ONLINE]: '已上线',
      [ProjectStatus.RELEASED]: '已发布',
      [ProjectStatus.CLOSED]: '已关闭',
    };
    return textMap[status!] || status;
  }

  /**
   * 优先级展示（颜色与文本）
   */
  function getPriorityColor(priority?: string) {
    const map: Record<string, string> = {
      low: 'green',
      medium: 'orange',
      high: 'red',
    };
    return map[(priority || '').toLowerCase()] || 'default';
  }

  function getPriorityText(priority?: string) {
    const map: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
    };
    const key = (priority || '').toLowerCase();
    return map[key] || priority || '-';
  }

  /**
   * 格式化时间
   */
  function formatTime(time?: string) {
    return time ? formatToDateTime(time) : '-';
  }

  // 组件挂载时加载数据
  onMounted(async () => {
    await loadProjectDetail();
    await loadBindings();
  });

  watch(projectId, async () => {
    await loadProjectDetail();
    await loadBindings();
  });
</script>

<style lang="less" scoped>
  .project-detail {
    padding: 24px;
    background-color: #f0f2f5;
    min-height: calc(100vh - 64px);

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0;
        font-size: 16px;
        color: #1890ff;

        &:hover {
          color: #40a9ff;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }
    }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .project-title {
        h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .project-meta {
          display: flex;
          align-items: center;
          gap: 12px;

          .project-id {
            color: #666;
            font-size: 14px;
          }
        }
      }

      .project-actions {
        display: flex;
        gap: 8px;
      }
    }

    .project-tabs {
      height: 100%;
      width: 100%;

      :deep(.ant-tabs-content-holder) {
        height: calc(100% - 44px);
        overflow: auto;
      }

      :deep(.ant-tabs-tabpane) {
        width: 100%;
        height: 100%;
      }
    }

    .tab-content {
      padding: 16px;
      width: 100%;
      box-sizing: border-box;
    }

    .design-links-section {
      margin-top: 24px;

      h3 {
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
      }

      .design-links {
        .design-link-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          padding: 8px;
          background: #fafafa;
          border-radius: 4px;

          .link-title {
            font-weight: 500;
          }

          .link-url {
            color: #1890ff;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }

    .git-branch-result {
      .git-command {
        text-align: left;

        h4 {
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
        }
      }
    }

    // 设置 PageWrapper 内容区背景为白色
    :deep(.content-white) {
      background-color: #ffffff;
    }
  }
</style>
