<!--应用流水线配置-->
<template>
  <div class="app-pipeline-config">
    <!-- 页面头部 -->
    <div class="page-header">
      <a-row :gutter="16" align="middle">
        <a-col :span="12">
          <h3>流水线配置</h3>
          <p class="page-description">管理应用的CI/CD流水线配置和运行历史</p>
        </a-col>
        <a-col :span="12" style="text-align: right">
          <a-space>
            <a-button @click="handleRefresh" :loading="loading">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
            <!-- <a-button type="primary" @click="handleCreatePipeline">
              <template #icon><PlusOutlined /></template>
              新建流水线
            </a-button> -->
            <a-button type="default" @click="openBindDrawer"> 绑定流水线 </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <a-divider />

    <!-- 已绑定的 Jenkins 流水线（表格展示） -->
    <div class="jenkins-bind-list">
      <BasicTable
        :columns="bindingColumns"
        :dataSource="bindings"
        :pagination="false"
        rowKey="id"
        :locale="{ emptyText: '暂无绑定的 Jenkins 流水线，请点击右上角“绑定流水线”进行配置' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'jobName'">
            <a-space>
              <a-avatar size="small" style="background-color: #722ed1">
                <template #icon><BranchesOutlined /></template>
              </a-avatar>
              <span class="job-name">{{ record.jobName }}</span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'jobUrl'">
            <template v-if="record.jobUrl">
              <a :href="record.jobUrl" target="_blank" style="color: #1890ff;">查看链接</a>
            </template>
            <template v-else>无链接</template>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a @click="editBinding(record)">编辑绑定</a>
              <a @click="removeBinding(record)" style="color: #ff4d4f">删除绑定</a>
            </a-space>
          </template>
        </template>
      </BasicTable>
    </div>

    <!-- 新增：绑定 Jenkins 流水线抽屉 -->
    <BasicDrawer
      v-model:open="bindDrawerVisible"
      :title="'绑定 Jenkins 流水线'"
      :width="600"
      showFooter
      :mask-closable="false"
      :destroy-on-close="true"
    >
      <BasicForm @register="registerBindForm" />
      <template #footer>
        <a-space>
          <a-button @click="bindDrawerVisible = false">取消</a-button>
          <a-button type="primary" :loading="bindSubmitting" @click="submitBindJenkins">保存绑定</a-button>
        </a-space>
      </template>
    </BasicDrawer>

    <!-- 日志查看弹窗 -->
    <a-modal v-model:open="logModalVisible" title="流水线运行日志" :width="1000" :footer="null" :destroy-on-close="true">
      <div class="pipeline-logs">
        <a-tabs v-model:activeKey="activeLogTab">
          <a-tab-pane v-for="stage in currentLogs.stages" :key="stage.name" :tab="stage.name">
            <div class="log-content">
              <pre>{{ stage.logs }}</pre>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive, onMounted, computed, nextTick } from 'vue';
  import { message } from 'ant-design-vue';
  import {
    PlusOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    StopOutlined,
    BranchesOutlined,
    QuestionCircleOutlined,
  } from '@ant-design/icons-vue';
  import { BasicDrawer } from '/@/components/Drawer';
  import { BasicForm, FormSchema } from '/@/components/Form';
  import { useForm } from '/@/components/Form/index';
  import { BasicTable } from '/@/components/Table';
  import type { PipelineConfig } from '../../config/data/Config.data';

  // 导入应用管理相关的API
  import { getPipelineHistory, rerunPipeline, cancelPipeline, getPipelineLogs } from '../AppManage.api';
  // 绑定相关API
  import { listBindings, saveBinding, deleteBinding, getBindingDetail, validateBinding } from '../AppManage.api';

  // 定义Props
  interface Props {
    appId?: string;
    appDetail?: any;
  }

  const props = withDefaults(defineProps<Props>(), {
    appId: '',
  });

  // 响应式数据
  const loading = ref(false);
  // 去除 Tab 切换，直接展示绑定列表

  // 简化：不再提供“创建 Jenkins 流水线”的复杂表单与弹窗

  // 注：已移除弹框中的“快速填充”选择器，改为仅通过嵌入的配置管理列表进行复制与预填

  // 运行历史相关
  const historyLoading = ref(false);
  const searchText = ref('');
  const statusFilter = ref<string>();
  const dateRange = ref<[string, string]>();
  const pipelineHistory = ref<any[]>([]);
  const historyPagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    onChange: (page: number, size: number) => {
      historyPagination.current = page;
      historyPagination.pageSize = size;
      loadPipelineHistory();
    },
  });

  // 绑定列表
  const bindings = ref<any[]>([]);

  // 表格列定义
  const bindingColumns = [
    { title: '作业名', dataIndex: 'jobName', key: 'jobName', width: 150 },
    { title: '类型', dataIndex: 'pipelineType', key: 'pipelineType', width: 120, customRender: ({ text }) => {
      const typeMap = { 'build': '构建', 'deploy': '部署', 'test': '测试' };
      return typeMap[text] || text;
    } },
    { title: '链接', dataIndex: 'jobUrl', key: 'jobUrl' , width: 200},
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, customRender: ({ text }) => {
      const statusMap = { enabled: '启用', disabled: '禁用' };
      return statusMap[text] || text;
    }},
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '操作', key: 'actions', width: 160, fixed: 'right' },
  ];

  // 绑定 Jenkins 流水线抽屉 & 表单
  const bindDrawerVisible = ref(false);
  const bindSubmitting = ref(false);
  const editingBindingId = ref<string | undefined>();
  const editingBindingEnv = ref<string | undefined>();
  const defaultEnvironment = 'test';
  // 简化绑定表单：仅作业名与备注
  const bindFormSchemas: FormSchema[] = [
    {
      field: 'jobName',
      label: '作业名',
      component: 'Input',
      required: true,
      componentProps: { placeholder: '例如：my-app-pipeline' },
    },
    {
      field: 'pipelineType',
      label: '流水线类型',
      component: 'Select',
      required: true,
      defaultValue: 'build',
      componentProps: {
        options: [
          { label: '构建', value: 'build' },
          { label: '部署', value: 'deploy' },
          { label: '测试', value: 'test' }
        ]
      }
    },
    {
      field: 'status',
      label: '状态',
      component: 'Select',
      required: true,
      defaultValue: 'enabled',
      componentProps: {
        options: [
          { label: '启用', value: 'enabled' },
          { label: '禁用', value: 'disabled' }
        ]
      }
    },

    {
      field: 'jobUrl',
      label: 'Jenkins链接',
      component: 'Input',
      componentProps: { placeholder: '例如：https://jenkins.company.local/job/...' },
    },
    {
      field: 'remark',
      label: '备注',
      component: 'InputTextArea',
      componentProps: { rows: 3, placeholder: '请输入备注（可选）' },
    },
  ];

  const [
    registerBindForm,
    { getFieldsValue: getBindFormValues, setFieldsValue: setBindFormValues, resetFields: resetBindForm, validate: validateBindForm },
  ] = useForm({
    labelWidth: 100,
    baseColProps: { span: 24 },
    showActionButtonGroup: false,
    schemas: bindFormSchemas,
  });

  // 绑定列表加载
  async function loadBindings() {
    try {
      const resp: any = await listBindings({ appId: props.appId });
      console.log(resp, 'resp----');
      const list = resp?.result?.records || [];
      bindings.value = (list || []).map((b: any) => ({
        id: b.id || '',
        jobName: b.pipelineName || b.name || '-',
        pipelineType: b.pipelineType || 'build', // 使用pipelineType字段，表格显示时会通过customRender映射为中文
        jobUrl: b.jobUrl || '',
        status: b.status || 'enabled', // 添加status字段
        remark: b.description || b.remark || b.config?.description || '',
      }));
    } catch (e) {
      console.error(e);
      message.error('加载绑定列表失败');
    }
  }

  function openBindDrawer() {
    bindDrawerVisible.value = true;
    editingBindingId.value = undefined;
    editingBindingEnv.value = undefined;
    nextTick(() => {
      resetBindForm();
    });
  }

  function editBinding(item: any) {
    bindDrawerVisible.value = true;
    editingBindingId.value = item.id;
    editingBindingEnv.value = item.environment;
    nextTick(() => {
      // 从中文值反向映射到英文键，如果需要
      const typeReverseMap = { '构建': 'build', '部署': 'deploy', '测试': 'test' };
      const pipelineTypeValue = typeReverseMap[item.pipelineType] || item.pipelineType || 'build';
      
      setBindFormValues({
        jobName: item.jobName,
        pipelineType: pipelineTypeValue,
        remark: item.remark,
        jobUrl: item.jobUrl,
        status: item.status || 'enabled'
      });
    });
  }

  async function submitBindJenkins() {
    try {
      bindSubmitting.value = true;
      await validateBindForm();
      const values = getBindFormValues();
      // 校验作业名
      try {
        await validateBinding(values.jobName);
      } catch (e) {
        // 后端返回校验失败则提示
        console.warn('validateBinding failed:', e);
      }
      const payload: any = {
        applicationId: props.appId,
        pipelineName: values.jobName,
        pipelineType: values.pipelineType || 'build', // 使用表单中的pipelineType值
        status: values.status || 'enabled', // 使用表单中的status值
        jobUrl: values.jobUrl,
        description: values.remark // 直接使用表单中的remark作为description字段
      };
      if (editingBindingId.value) payload.id = editingBindingId.value;
      await saveBinding(payload);
      message.success('绑定保存成功');
      bindDrawerVisible.value = false;
      await loadBindings();
    } catch (e) {
      console.error(e);
      message.error('绑定失败，请稍后重试');
    } finally {
      bindSubmitting.value = false;
    }
  }

  async function removeBinding(item: any) {
    try {
      await deleteBinding(item.id);
      // message.success('已删除绑定');
      await  loadBindings();
    } catch (e) {
      console.error(e);
      message.error('删除绑定失败');
    }
  }

  // 基础信息表单 Schema（用于配置抽屉）
  // 移除配置抽屉相关Schema

  // 抽屉标题
  // 移除配置抽屉标题

  // 状态与时间格式化
  function getStatusColor(status: string) {
    switch (status) {
      case 'success':
        return 'green';
      case 'failed':
        return '#ff4d4f';
      case 'running':
        return '#1890ff';
      case 'cancelled':
        return '#d9d9d9';
      default:
        return '#d9d9d9';
    }
  }
  function getStatusText(status: string) {
    const map: Record<string, string> = {
      success: '成功',
      failed: '失败',
      running: '运行中',
      cancelled: '已取消',
    };
    return map[status] || '未知';
  }
  function formatTime(ts: any) {
    if (!ts) return '-';
    try {
      const d = typeof ts === 'number' ? new Date(ts) : new Date(String(ts));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    } catch {
      return String(ts);
    }
  }
  function formatDuration(ms: number) {
    if (!ms && ms !== 0) return '-';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const ss = s % 60;
    const mm = m % 60;
    const hh = h;
    if (hh) return `${hh}h ${mm}m ${ss}s`;
    if (mm) return `${mm}m ${ss}s`;
    return `${ss}s`;
  }

  // 移除配置列表加载逻辑

  // 加载运行历史
  async function loadPipelineHistory() {
    try {
      historyLoading.value = true;
      const params: any = {
        pageNo: historyPagination.current,
        pageSize: historyPagination.pageSize,
      };
      if (searchText.value) params.search = searchText.value;
      if (statusFilter.value) params.status = statusFilter.value;
      if (dateRange.value && dateRange.value.length === 2) {
        params.startTime = dateRange.value[0];
        params.endTime = dateRange.value[1];
      }
      const resp: any = await getPipelineHistory(props.appId, params);
      const list = Array.isArray(resp)
        ? resp
        : Array.isArray(resp?.result)
          ? resp.result
          : Array.isArray(resp?.records)
            ? resp.records
            : Array.isArray(resp?.data)
              ? resp.data
              : Array.isArray(resp?.items)
                ? resp.items
                : [];
      const total =
        typeof resp?.total === 'number'
          ? resp.total
          : typeof resp?.result?.total === 'number'
            ? resp.result.total
            : typeof resp?.totalCount === 'number'
              ? resp.totalCount
              : Array.isArray(list)
                ? list.length
                : 0;
      historyPagination.total = total;
      pipelineHistory.value = (list || []).map((h: any) => ({
        id: h.id || h.historyId || h.runId || '',
        pipelineName: h.pipelineName || h.name || '未命名流水线',
        commitMessage: h.commitMessage || h.message || '',
        commitHash: h.commitHash || h.commitId || h.sha || '',
        triggeredBy: h.triggeredBy || h.user || h.actor || '-',
        duration: h.duration || h.runTime || 0,
        startTime: h.startTime || h.createdAt || h.start_at || h.startTimeMs || '',
        status: h.status || h.runStatus || h.state || 'success',
      }));
    } catch (e) {
      console.error(e);
      message.error('加载运行历史失败');
    } finally {
      historyLoading.value = false;
    }
  }

  // 过滤与刷新事件
  function handleSearch() {
    historyPagination.current = 1;
    loadPipelineHistory();
  }
  function handleStatusFilter() {
    historyPagination.current = 1;
    loadPipelineHistory();
  }
  function handleDateFilter() {
    historyPagination.current = 1;
    loadPipelineHistory();
  }
  function handleClearFilters() {
    searchText.value = '';
    statusFilter.value = undefined;
    dateRange.value = undefined as any;
    historyPagination.current = 1;
    loadPipelineHistory();
  }

  // 日志弹窗相关
  const logModalVisible = ref(false);
  const currentLogs = reactive<{ stages: any[] }>({ stages: [] });
  const activeLogTab = ref<string>('');

  async function handleViewLogs(item: any) {
    try {
      const runId = item?.id || item?.historyId;
      if (!runId) return;
      const resp: any = await getPipelineLogs(props.appId, runId);
      const stages = Array.isArray(resp?.result?.stages)
        ? resp.result.stages
        : Array.isArray(resp?.data?.stages)
          ? resp.data.stages
          : Array.isArray(resp?.stages)
            ? resp.stages
            : [];
      currentLogs.stages = stages.map((s: any, idx: number) => ({
        name: s?.name || `Stage ${idx + 1}`,
        logs: s?.logs || s?.content || '',
      }));
      activeLogTab.value = currentLogs.stages[0]?.name || '';
      logModalVisible.value = true;
    } catch (e) {
      console.error(e);
      message.error('获取日志失败');
    }
  }

  async function handleRerun(item: any) {
    try {
      const runId = item?.id || item?.historyId;
      if (!runId) return;
      await rerunPipeline(props.appId, runId);
      message.success('已重新触发运行');
      loadPipelineHistory();
    } catch (e) {
      console.error(e);
      message.error('重新运行失败');
    }
  }

  async function handleCancel(item: any) {
    try {
      const runId = item?.id || item?.historyId;
      if (!runId) return;
      await cancelPipeline(props.appId, runId);
      message.success('已取消运行');
      loadPipelineHistory();
    } catch (e) {
      console.error(e);
      message.error('取消运行失败');
    }
  }

  // 移除新建流水线入口

  // 移除创建 Jenkins Job 表单提交

  async function handleRefresh() {
    try {
      loading.value = true;
      await Promise.all([loadBindings()]);
      message.success('已刷新');
    } catch (e) {
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  // 初始加载
  onMounted(() => {
    handleRefresh();
  });
</script>

<style lang="less" scoped>
  .app-pipeline-config {
    padding: 16px;
    background: #fff;
    border-radius: 6px;

    .page-header {
      margin-bottom: 16px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #262626;
      }

      .page-description {
        margin: 4px 0 0 0;
        color: #8c8c8c;
        font-size: 14px;
      }
    }

    .history-toolbar {
      margin-bottom: 16px;
      padding: 16px;
      background: #fafafa;
      border-radius: 6px;
    }

    .history-list {
      .history-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .pipeline-name {
          font-weight: 500;
        }

        .status-tag {
          font-size: 12px;
        }
      }

      .history-description {
        .commit-info {
          margin-bottom: 4px;

          .commit-message {
            margin-right: 12px;
          }

          .commit-hash {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            color: #8c8c8c;
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
          }
        }

        .run-info {
          font-size: 12px;
          color: #8c8c8c;

          span {
            margin-right: 16px;
          }
        }
      }
    }

    .config-list {
      .config-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .config-name {
          font-weight: 500;
        }
      }

      .config-description {
        .config-meta {
          margin-top: 4px;
          font-size: 12px;
          color: #8c8c8c;

          span {
            margin-right: 16px;
          }
        }
      }
    }

    .config-form-section {
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 16px;
    }

    .pipeline-editor-section {
      margin-top: 16px;
    }

    .pipeline-logs {
      .log-content {
        background: #001529;
        color: #fff;
        padding: 16px;
        border-radius: 6px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.5;
        max-height: 400px;
        overflow-y: auto;

        pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
      }
    }

    .jenkins-bind-list {
      .binding-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .binding-desc {
        color: #666;
      }
    }
  }
</style>
