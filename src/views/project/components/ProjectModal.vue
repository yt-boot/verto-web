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
import { saveProject, updateProject } from '../Project.api';

const emit = defineEmits(['success', 'register']);

const isUpdate = ref(false);
const recordRef = ref<any>({});

const getTitle = computed(() => (!unref(isUpdate) ? '新增项目' : '编辑项目'));

const [registerForm, { setFieldsValue, validate, resetFields }] = useForm({
  labelWidth: 120,
  showActionButtonGroup: false,
  baseColProps: { span: 24 },
  schemas: [...step1Schemas, ...step2Schemas, ...step3Schemas],
});

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
    };
    setFieldsValue(initial);
  } else {
    resetFields();
    setFieldsValue({ designLinks: [] });
  }
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

    const gitBranch = computeBranch(values);

    // 确保编辑请求携带正确的主键ID（有些情况下 id 不在表单 schema 中，validate 返回的 values 可能缺少 id）
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
    } as ProjectModel;

    setModalProps({ confirmLoading: true });
    if (isUpdate.value) {
      await updateProject(payload);
      message.success('项目更新成功！');
    } else {
      await saveProject(payload);
      message.success('项目创建成功！');
    }
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