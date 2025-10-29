<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    :title="getTitle"
    :width="720"
    showFooter
    :mask-closable="false"
    :destroy-on-close="true"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm" />
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, computed, unref } from 'vue';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { BasicForm, useForm } from '/@/components/Form';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { formSchema, StaffModel } from './staff.data';
  import { saveOrUpdateStaff } from './staff.api';

  const emit = defineEmits(['success', 'register']);

  const { createMessage } = useMessage();
  const isUpdate = ref<boolean>(false);
  const isView = ref<boolean>(false);
  const rowId = ref<string>('');

  const [registerForm, { setFieldsValue, updateSchema, resetFields, validate, setProps }] = useForm({
    labelWidth: 120,
    schemas: formSchema,
    showActionButtonGroup: false,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data: any) => {
    // 初始化
    resetFields();
    setDrawerProps({ confirmLoading: false });
    isUpdate.value = !!data?.isUpdate;
    isView.value = !!data?.isView;

    // 视图模式：禁用所有字段、隐藏确定按钮
    if (unref(isView)) {
      setDrawerProps({ showOkBtn: false, showCancelBtn: true });
      // 禁用所有表单项
      const disabledPatch = formSchema.map((s) => ({
        field: s.field,
        componentProps: { ...(s as any).componentProps, disabled: true },
      }));
      updateSchema(disabledPatch as any);
    } else {
      // 编辑/新增时显示确定按钮
      setDrawerProps({ showOkBtn: true, showCancelBtn: true });
      // 还原禁用状态
      const enablePatch = formSchema.map((s) => ({
        field: s.field,
        componentProps: { ...(s as any).componentProps, disabled: false },
      }));
      updateSchema(enablePatch as any);
    }

    // 更新标题
    setDrawerProps({ title: unref(getTitle) });

    // 编辑 / 查看模式填充数据
    if (data?.record) {
      rowId.value = data.record.id;
      setFieldsValue({ ...data.record });
    }
  });

  const getTitle = computed(() => (unref(isView) ? '人员详情' : unref(isUpdate) ? '编辑人员' : '新增人员'));

  async function handleSubmit() {
    if (unref(isView)) {
      // 查看模式无提交
      closeDrawer();
      return;
    }
    try {
      const values = await validate();
      setDrawerProps({ confirmLoading: true });
      await saveOrUpdateStaff(values as StaffModel, unref(isUpdate));
      createMessage.success(`${unref(isUpdate) ? '编辑' : '新增'}成功！`);
      closeDrawer();
      emit('success');
    } catch (error) {
      console.error('提交失败:', error);
      createMessage.error('提交失败，请检查表单数据');
    } finally {
      setDrawerProps({ confirmLoading: false });
    }
  }
</script>

<style scoped>
  .ant-form-item {
    margin-bottom: 16px;
  }
</style>