<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    :title="getTitle"
    width="900px"
    showFooter
    :footerStyle="{ textAlign: 'right' }"
    @ok="handleSubmit"
  >
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
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import { BasicForm, useForm } from '/@/components/Form';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import {
  step1Schemas,
  step2Schemas,
  step3Schemas,
  ProjectType,
  ProjectStatus,
  ProjectModel,
} from '../Project.data';
import { saveProject, updateProject, getPipelineBindingList } from '../Project.api';

interface Emits {
  (e: 'register', ...args: any[]): void;
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const isUpdate = ref(false);
const recordRef = ref<any>({});

const getTitle = computed(() => (!isUpdate.value ? '新增项目' : '编辑项目'));

const [registerForm, { setFieldsValue, getFieldsValue, validate, resetFields, updateSchema }] = useForm({
  labelWidth: 120,
  showActionButtonGroup: false,
  baseColProps: { span: 24 },
  // 将分步表单合并为单页表单
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

const [registerDrawer, { setDrawerProps }] = useDrawerInner(async (data) => {
  // 初始化抽屉数据
  isUpdate.value = !!data?.isUpdate;
  recordRef.value = data?.record || {};

  // 编辑时回填，新增时重置为空表单
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
      // ApiSelect 已开启 labelInValue，需要传入 { value, label }
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
    // 加载该应用的绑定流水线
    await loadPipelineBindings(recordRef.value.relatedAppId);
    // 设置默认选中
    selectedBinding.value = pipelineBinding || null;
  } else {
    // 清空所有字段，确保抽屉为“空表单”
    resetFields();
    // 确保设计链接数组初始化为空以便插槽正常工作
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
    return `feature/REQ-${values.requirementId}`;
  }
  if (values?.type === ProjectType.BUG && values?.bugId) {
    return `bugfix/BUG-${values.bugId}`;
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

    // 生成分支名（只读显示）
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
      // ApiSelect 使用 labelInValue，保存名称与ID
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
      // 保存优先级以便后端持久化与前端回填
      priority: values.priority,
      gitBranch,
      appConfig: {
        ...originalAppConfig,
        pipelineBinding: values.pipelineBinding || selectedBinding.value || null,
      },
    } as ProjectModel;

    setDrawerProps({ loading: true });
    if (isUpdate.value) {
      await updateProject(payload);
      message.success('项目更新成功！');
    } else {
      await saveProject(payload);
      message.success('项目创建成功！');
    }
    setDrawerProps({ loading: false });
    emit('success');
  } catch (e) {
    console.error(e);
    setDrawerProps({ loading: false });
    message.error('提交失败，请检查表单信息');
  }
}
</script>

<style lang="less" scoped>
.design-links {
  .design-link-item {
    margin-bottom: 8px;
  }
}
</style>