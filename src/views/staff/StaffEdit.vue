<template>
  <div class="staff-edit">
    <PageWrapper title="编辑人员" @back="goBack" content="修改人员信息">
      <template #extra>
        <a-button @click="goBack">取消</a-button>
        <a-button type="primary" @click="handleSubmit" :loading="submitLoading">
          <Icon icon="ant-design:save-outlined" />
          保存
        </a-button>
      </template>

      <div class="staff-edit-content">
        <a-card title="基本信息">
          <BasicForm @register="registerForm" />
        </a-card>
      </div>
    </PageWrapper>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { PageWrapper } from '/@/components/Page';
  import { BasicForm, useForm } from '/@/components/Form';
  import { Icon } from '/@/components/Icon';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { formSchema } from './staff.data';
  import { getStaffById, updateStaff } from './staff.api';
  import dayjs from 'dayjs';

  const route = useRoute();
  const router = useRouter();
  const { createMessage } = useMessage();

  const submitLoading = ref(false);

  /**
   * 表单配置
   */
  const [registerForm, { setFieldsValue, validate, resetFields }] = useForm({
    labelWidth: 120,
    schemas: formSchema,
    showActionButtonGroup: false,
    baseColProps: { lg: 12, md: 24 },
  });

  /**
   * 获取人员信息并填充表单
   */
  async function fetchStaffInfo() {
    try {
      const id = route.params.id as string;
      const result = await getStaffById(id);
      // 规范化后端数据，确保与表单组件类型匹配
      const normalized = {
        ...result,
        // skills 后端为字符串（JSON），前端 Select(tags) 需要数组
        skills: Array.isArray(result?.skills)
          ? result.skills
          : (() => {
              try {
                const arr = JSON.parse(result?.skills ?? '[]');
                return Array.isArray(arr) ? arr : [];
              } catch (e) {
                const s = result?.skills as any;
                return typeof s === 'string' ? s.split(',').map((x) => x.trim()).filter(Boolean) : [];
              }
            })(),
        // 入职时间为字符串或日期，统一为 YYYY-MM-DD
        hireDate: result?.hireDate ? dayjs(result.hireDate).format('YYYY-MM-DD') : undefined,
      };
      await setFieldsValue(normalized);
    } catch (error) {
      createMessage.error('获取人员信息失败');
    }
  }

  /**
   * 提交表单
   */
  async function handleSubmit() {
    try {
      submitLoading.value = true;
      const values = await validate();
      const id = route.params.id as string;
      
      await updateStaff({ ...values, id });
      createMessage.success('保存成功');
      goBack();
    } catch (error) {
      createMessage.error('保存失败');
    } finally {
      submitLoading.value = false;
    }
  }

  /**
   * 返回列表页
   */
  function goBack() {
    router.push('/staff/list');
  }

  onMounted(() => {
    fetchStaffInfo();
  });
</script>

<style lang="less" scoped>
  .staff-edit {
    &-content {
      padding: 16px;
    }
  }
</style>