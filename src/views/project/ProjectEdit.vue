<template>
  <div class="project-edit-page">
    <PageWrapper 
      :title="pageTitle" 
      content="项目信息编辑"
      contentBackground
      @back="handleBack"
    >
      <template #headerContent>
        <div class="page-header-content">
          <div class="breadcrumb">
            <a-breadcrumb>
              <a-breadcrumb-item>
                <router-link to="/project/list">项目管理</router-link>
              </a-breadcrumb-item>
              <a-breadcrumb-item>{{ pageTitle }}</a-breadcrumb-item>
            </a-breadcrumb>
          </div>
        </div>
      </template>

      <div class="project-edit-container">
        <BasicForm @register="registerForm">
          <template #designLinks="{ model, field }">
            <div class="design-links">
              <div v-for="(link, index) in model[field]" :key="index" class="design-link-item">
                <a-input-group compact>
                  <a-input v-model:value="link.title" style="width: 150px" placeholder="链接标题" />
                  <a-input v-model:value="link.url" style="width: calc(100% - 300px)" placeholder="链接地址" />
                  <a-button type="text" danger @click="removeDesignLink(model[field], index)" style="width: 50px">删除</a-button>
                </a-input-group>
              </div>
              <a-button type="dashed" @click="addDesignLink(model[field])" style="width: 100%; margin-top: 8px">
                <PlusOutlined />
                添加设计链接
              </a-button>
            </div>
          </template>
          <template #pipelineBinding="{ model, field }">
            <div>
              <a-space align="start">
                <a-select
                  :value="model[field]?.id ? String(model[field]?.id) : undefined"
                  :loading="pipelineLoading"
                  :options="pipelineOptions.map(b => ({ label: `${b.jobName}${b.environment ? ' (' + b.environment + ')' : ''}`, value: String(b.id) }))"
                  style="min-width: 320px"
                  placeholder="请选择需要绑定的 Jenkins 流水线"
                  allowClear
                  @change="(val) => {
                    const selected = pipelineOptions.find(b => String(b.id) === String(val)) || null;
                    selectedBinding.value = selected as any;
                    model[field] = selected;
                  }"
                />
                <div v-if="model[field]?.jobUrl" style="line-height: 32px;">
                  已选择：<a :href="model[field].jobUrl" target="_blank">{{ model[field].jobName }}</a>
                  <span v-if="model[field].environment">（{{ model[field].environment }}）</span>
                </div>
              </a-space>
            </div>
          </template>
        </BasicForm>
        <div class="page-actions">
          <a-button type="primary" @click="handleSubmit">保存</a-button>
          <a-button style="margin-left: 8px" @click="handleCancel">取消</a-button>
        </div>
      </div>
    </PageWrapper>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { PageWrapper } from '/@/components/Page';
  import { BasicForm, useForm } from '/@/components/Form';
  import { PlusOutlined } from '@ant-design/icons-vue';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { message } from 'ant-design-vue';
  import { getProjectDetail, saveProject, updateProject, getPipelineBindingList } from './Project.api';
  import { step1Schemas, step2Schemas, step3Schemas, ProjectType, ProjectModel } from './Project.data';

  const route = useRoute();
  const router = useRouter();
  const { createMessage } = useMessage();

  const loading = ref(false);
  const [registerForm, { setFieldsValue, validate, resetFields }] = useForm({
    labelWidth: 120,
    showActionButtonGroup: false,
    baseColProps: { span: 24 },
    schemas: [...step1Schemas, ...step2Schemas, ...step3Schemas],
  });

  // 绑定流水线下拉选项与选择
  type BindingItem = { id?: string | number; jobName: string; jobUrl?: string; environment?: string; remark?: string };
  const pipelineOptions = ref<BindingItem[]>([]);
  const selectedBinding = ref<BindingItem | null>(null);
  const pipelineLoading = ref(false);

  async function loadPipelineBindings(appId?: string) {
    if (!appId) {
      pipelineOptions.value = [];
      selectedBinding.value = null;
      return;
    }
    try {
      pipelineLoading.value = true;
      const res = await getPipelineBindingList({ appId });
      pipelineOptions.value = Array.isArray(res?.records) ? res.records : [];
      pipelineLoading.value = false;
    } catch (e) {
      pipelineOptions.value = [];
      pipelineLoading.value = false;
    }
  }

  // 页面标题
  const pageTitle = computed(() => {
    return route.params.id ? '编辑项目' : '新建项目';
  });

  // 是否为编辑模式
  const isEdit = computed(() => {
    return !!route.params.id;
  });

  /**
   * 初始化数据
   */
  async function initData() {
    if (!isEdit.value) {
      resetFields();
      setFieldsValue({ designLinks: [], pipelineBinding: null });
      return;
    }
    
    try {
      loading.value = true;
      const result = await getProjectDetail({ id: route.params.id });
      // 设计链接可能为字符串，需解析为数组
      let designLinks = result.designLinks;
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

      // 解析 appConfig 以回填绑定的流水线
      let appConfig: any = result.appConfig as any;
      if (typeof appConfig === 'string') {
        try {
          appConfig = JSON.parse(appConfig);
        } catch (e) {
          appConfig = {};
        }
      }
      const pipelineBinding = appConfig?.pipelineBinding || null;

      const initial = {
        id: result.id,
        type: result.projectType,
        requirementId: result.requirementId,
        bugId: result.bugId,
        title: result.title,
        description: result.description,
        appId: {
          value: result.relatedAppId,
          label: result.relatedAppName || '',
        },
        developerId: {
          value: result.developerId,
          label: result.developerName || '',
        },
        status: result.status,
        priority: result.priority,
        gitBranch: result.gitBranch,
        designLinks,
        startTime: result.startTime,
        testTime: result.testTime,
        onlineTime: result.onlineTime,
        releaseTime: result.releaseTime,
        remark: result.remark,
        pipelineBinding,
      };
      setFieldsValue(initial);
      // 加载该应用的绑定流水线并设置默认选中
      await loadPipelineBindings(result.relatedAppId);
      selectedBinding.value = pipelineBinding || null;
    } catch (error) {
      console.error('获取项目详情失败:', error);
      createMessage.error('获取项目详情失败');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 返回列表页
   */
  function handleBack() {
    router.push('/project/list');
  }

  function computeBranch(values: any) {
    if (values?.type === ProjectType.REQUIREMENT && values?.requirementId) {
      return `${values.requirementId}`;
    }
    if (values?.type === ProjectType.BUG && values?.bugId) {
      return `${values.bugId}`;
    }
    return values?.gitBranch || '';
  }

  async function handleSubmit() {
    try {
      const values = await validate();

      // 基本校验
      if (values.type === ProjectType.REQUIREMENT && !values.requirementId) {
        message.error('请输入需求ID');
        return;
      }
      if (values.type === ProjectType.BUG && !values.bugId) {
        message.error('请输入BUG ID');
        return;
      }
      if (!values.title?.trim()) {
        message.error('请输入项目标题');
        return;
      }
      if (!values.appId) {
        message.error('请选择关联应用');
        return;
      }
      if (!values.developerId) {
        message.error('请选择开发人员');
        return;
      }

      const gitBranch = computeBranch(values);
      // 组装 appConfig，保存绑定的流水线信息
      let originalAppConfig: any = (await getProjectDetail({ id: route.params.id }))?.appConfig;
      if (typeof originalAppConfig === 'string') {
        try { originalAppConfig = JSON.parse(originalAppConfig); } catch (e) { originalAppConfig = {}; }
      }
      if (!originalAppConfig || typeof originalAppConfig !== 'object') {
        originalAppConfig = {};
      }

      const payload: ProjectModel = {
        id: values.id,
        projectType: values.type,
        requirementId: values.requirementId,
        bugId: values.bugId,
        title: values.title,
        description: values.description,
        relatedAppId: values.appId?.value ?? values.appId,
        relatedAppName: values.appId?.label,
        developerId: values.developerId?.value ?? values.developerId,
        developerName: values.developerId?.label,
        designLinks: values.designLinks || [],
        startTime: values.startTime,
        testTime: values.testTime,
        onlineTime: values.onlineTime,
        releaseTime: values.releaseTime,
        status: values.status,
        priority: values.priority,
        gitBranch,
        appConfig: {
          ...originalAppConfig,
          pipelineBinding: values.pipelineBinding || selectedBinding.value || null,
        },
      } as ProjectModel;

      if (isEdit.value) {
        await updateProject(payload);
        createMessage.success('项目更新成功');
      } else {
        await saveProject(payload);
        createMessage.success('项目创建成功');
      }
      // 将绑定的流水线选择写入本地存储，供列表/详情的回退逻辑使用
      try {
        const binding = (payload.appConfig as any)?.pipelineBinding;
        const projectId = payload.id;
        if (projectId && binding && binding.id) {
          const storageKey = `projectPipelineSelection:${projectId}`;
          localStorage.setItem(storageKey, String(binding.id));
        }
      } catch (_) {}
      router.push('/project/list');
    } catch (e) {
      console.error(e);
      message.error('提交失败，请检查表单信息');
    }
  }

  /**
   * 取消操作
   */
  function handleCancel() {
    router.push('/project/list');
  }

  onMounted(() => {
    initData();
  });

  // 当应用选择变化时，动态加载流水线绑定列表
  // 注意：BasicForm 的 ApiSelect（appId）开启了 labelInValue
  // 我们需要监听其变化并重置当前的绑定选择
  // 由于 ProjectEdit 使用的是静态 schemas，我们在初始化后通过 setFieldsValue 设置初始值，
  // 这里使用 window.requestAnimationFrame 以确保插槽与组件渲染完成后再注入 onChange。
  requestAnimationFrame(async () => {
    // 这里直接依赖 BasicForm 的 updateSchema 能力；如果不可用，可在此处使用全局事件或额外的 watch。
    // 为避免引入 useForm 的 updateSchema，这里通过简单的 DOM 交互即可：
    // 但更稳妥的做法还是使用 updateSchema；因此我们重新声明 useForm 解构（兼容上方已有解构）。
  });
</script>

<style lang="less" scoped>
  .project-edit-page {
    .page-header-content {
      .breadcrumb {
        margin-bottom: 16px;
      }
    }

    .project-edit-container {
      background: #fff;
      border-radius: 6px;
      padding: 24px;
      min-height: 600px;

      :deep(.ant-steps) {
        margin-bottom: 32px;
      }

      :deep(.step-form-container) {
        border: none;
        box-shadow: none;
        padding: 0;
      }

      :deep(.step-form-footer) {
        border-top: 1px solid #f0f0f0;
        margin-top: 32px;
        padding-top: 24px;
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .project-edit-page {
      .project-edit-container {
        padding: 16px;
        margin: 0 -16px;
        border-radius: 0;
      }
    }
  }
</style>