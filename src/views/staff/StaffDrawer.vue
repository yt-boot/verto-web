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
    <template v-if="isView">
      <a-descriptions bordered size="small" :column="2">
        <a-descriptions-item label="姓名">{{ record?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="工号">{{ record?.employeeNo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="邮箱">{{ record?.email || '-' }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ record?.phone || '-' }}</a-descriptions-item>
        <a-descriptions-item label="入职时间">{{ record?.hireDate || '-' }}</a-descriptions-item>
        <a-descriptions-item label="工位位置">{{ record?.workLocation || '-' }}</a-descriptions-item>
        <a-descriptions-item label="擅长技能">
          {{ Array.isArray(record?.skills) ? record?.skills.join(', ') : (record?.skills || '-') }}
        </a-descriptions-item>
        <a-descriptions-item label="积分">{{ record?.points ?? 0 }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <template v-if="record?.status === 1">在职</template>
          <template v-else-if="record?.status === 0">离职</template>
          <template v-else-if="record?.status === 2">休假</template>
          <template v-else>未知</template>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ record?.createTime || '-' }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ record?.updateTime || '-' }}</a-descriptions-item>
        <a-descriptions-item label="备注" :span="2">{{ (record as any)?.remark || '-' }}</a-descriptions-item>
      </a-descriptions>
    </template>
    <template v-else>
      <BasicForm @register="registerForm" />
    </template>
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
  const record = ref<StaffModel | null>(null);

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
      // 详情模式不显示表单，直接使用描述组件；无需禁用表单项
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
      record.value = { ...data.record } as StaffModel;
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