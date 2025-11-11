<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    :title="getTitle"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="900px"
  >
  <BasicForm @register="registerForm">
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
    </BasicForm>
  </BasicModal>
</template>

<script lang="ts" setup>
import { ref, computed, unref } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { BasicForm, useForm } from '/@/components/Form';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { 
  step1Schemas,
  step2Schemas,
  step3Schemas,
  ProjectType,
  ProjectModel,
} from '../Project.data';
import { saveProject, updateProject, getPipelineBindingList } from '../Project.api';

const emit = defineEmits(['success', 'register']);

const isUpdate = ref(false);
const recordRef = ref<any>({});

const getTitle = computed(() => (!unref(isUpdate) ? '新增项目' : '编辑项目'));

const [registerForm, { setFieldsValue, validate, resetFields, updateSchema, getFieldsValue }] = useForm({
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

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  setModalProps({ confirmLoading: false });
  
  isUpdate.value = !!data?.isUpdate;
  recordRef.value = data?.record || {};

  if (isUpdate.value) {
    // 设计链接可能为字符串，需解析为数组
    let designLinks = recordRef.value.designLinks;
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
    let appConfig: any = recordRef.value.appConfig;
    if (typeof appConfig === 'string') {
      try {
        appConfig = JSON.parse(appConfig);
      } catch (e) {
        appConfig = {};
      }
    }
    const pipelineBinding = appConfig?.pipelineBinding || null;

    const initial = {
      id: recordRef.value.id,
      type: recordRef.value.projectType,
      requirementId: recordRef.value.requirementId,
      bugId: recordRef.value.bugId,
      title: recordRef.value.title,
      description: recordRef.value.description,
      appId: {
        value: recordRef.value.relatedAppId,
        label: recordRef.value.relatedAppName || '',
      },
      developerId: {
        value: recordRef.value.developerId,
        label: recordRef.value.developerName || '',
      },
      status: recordRef.value.status,
      priority: recordRef.value.priority,
      gitBranch: recordRef.value.gitBranch,
      designLinks,
      startTime: recordRef.value.startTime,
      testTime: recordRef.value.testTime,
      onlineTime: recordRef.value.onlineTime,
      releaseTime: recordRef.value.releaseTime,
      remark: recordRef.value.remark,
      pipelineBinding,
    };
    setFieldsValue(initial);
    await loadPipelineBindings(recordRef.value.relatedAppId);
    selectedBinding.value = pipelineBinding || null;
  } else {
    resetFields();
    setFieldsValue({ designLinks: [], pipelineBinding: null });
  }

  // 当应用选择变化时，动态加载流水线绑定列表
  await updateSchema({
    field: 'appId',
    componentProps: {
      onChange: async (opt: any) => {
        const appId = opt?.value ?? opt;
        await loadPipelineBindings(appId);
        // 清空当前选择
        selectedBinding.value = null;
        setFieldsValue({ pipelineBinding: null });
      },
    },
  });

  // 监听类型与ID变化，动态生成只读 gitBranch 的显示值
  const refreshBranch = () => {
    const vals = getFieldsValue();
    const branch = computeBranch(vals);
    setFieldsValue({ gitBranch: branch });
  };
  await updateSchema({ field: 'type', componentProps: { onChange: refreshBranch } });
  await updateSchema({ field: 'requirementId', componentProps: { onChange: refreshBranch } });
  await updateSchema({ field: 'bugId', componentProps: { onChange: refreshBranch } });
});

function addDesignLink(list: any[]) {
  if (!Array.isArray(list)) return;
  list.push({ title: '', url: '', type: 'prototype' });
}

function removeDesignLink(list: any[], index: number) {
  if (!Array.isArray(list)) return;
  list.splice(index, 1);
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

    // 确保编辑请求携带正确的主键ID（有些情况下 id 不在表单 schema 中，validate 返回的 values 可能缺少 id）
    // 组装 appConfig，保存绑定的流水线信息
    let originalAppConfig: any = recordRef.value?.appConfig;
    if (typeof originalAppConfig === 'string') {
      try { originalAppConfig = JSON.parse(originalAppConfig); } catch (e) { originalAppConfig = {}; }
    }
    if (!originalAppConfig || typeof originalAppConfig !== 'object') {
      originalAppConfig = {};
    }

    const payload: ProjectModel = {
      id: recordRef.value?.id ?? values.id,
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

    setModalProps({ confirmLoading: true });
    if (isUpdate.value) {
      await updateProject(payload);
      message.success('项目更新成功！');
    } else {
      await saveProject(payload);
      message.success('项目创建成功！');
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
    setModalProps({ confirmLoading: false });
    handleSuccess();
  } catch (e) {
    console.error(e);
    setModalProps({ confirmLoading: false });
    message.error('提交失败，请检查表单信息');
  }
}

function handleSuccess() {
  closeModal();
  emit('success');
}

function handleCancel() {
  closeModal();
}
</script>

<style lang="less" scoped>
// 样式可以根据需要调整
.design-links {
  .design-link-item {
    margin-bottom: 8px;
  }
}
</style>