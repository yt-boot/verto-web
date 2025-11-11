<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref, computed, unref } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { saveOrUpdateStaff } from './staff.api';
  import { formSchema, StaffModel } from './staff.data';
  import dayjs from 'dayjs';

  // 定义组件事件
  const emit = defineEmits(['success', 'register']);

  const { createMessage } = useMessage();
  const isUpdate = ref(true);
  const rowId = ref('');

  // 注册表单
  const [registerForm, { setFieldsValue, updateSchema, resetFields, validate }] = useForm({
    labelWidth: 100,
    schemas: formSchema,
    showActionButtonGroup: false,
    actionColOptions: {
      span: 23,
    },
  });

  // 注册弹窗
  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    resetFields();
    setModalProps({ confirmLoading: false });
    isUpdate.value = !!data?.isUpdate;

    if (unref(isUpdate)) {
      rowId.value = data.record.id;
      const normalized: StaffModel = {
        ...(data.record as StaffModel),
        skills: Array.isArray(data.record?.skills)
          ? (data.record.skills as any)
          : (() => {
              try {
                const arr = JSON.parse((data.record as any)?.skills ?? '[]');
                return Array.isArray(arr) ? arr : [];
              } catch (e) {
                const s = (data.record as any)?.skills;
                return typeof s === 'string' ? s.split(',').map((x: string) => x.trim()).filter(Boolean) : [];
              }
            })(),
        hireDate: data.record?.hireDate ? dayjs(data.record.hireDate as any).format('YYYY-MM-DD') : undefined,
      } as any;
      setFieldsValue(normalized as any);
    }
  });

  /**
   * 弹窗标题
   */
  const getTitle = computed(() => (!unref(isUpdate) ? '新增人员' : '编辑人员'));



  /**
   * 提交表单
   */
  async function handleSubmit() {
    try {
      const values = await validate();
      setModalProps({ confirmLoading: true });

      // 调用API保存数据
      const payload = {
        ...(values as any),
        skills: Array.isArray((values as any)?.skills)
          ? JSON.stringify((values as any).skills)
          : (values as any)?.skills ?? '[]',
      };
      await saveOrUpdateStaff(payload, unref(isUpdate));
      
      createMessage.success(`${unref(isUpdate) ? '编辑' : '新增'}成功！`);
      closeModal();
      emit('success');
    } catch (error) {
      console.error('提交失败:', error);
      createMessage.error('提交失败，请检查表单数据');
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>

<style scoped>
  .ant-form-item {
    margin-bottom: 16px;
  }
</style>