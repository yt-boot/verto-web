<template>
  <div class="staff-points-manage">
    <PageWrapper title="积分管理" content="主要展示积分流水列表，支持通过抽屉进行新增调整">
      <template #extra>
        <a-space>
          <a-button @click="goBack">返回列表</a-button>
          <a-button type="primary" @click="openAdjustDrawer">
            <Icon icon="ant-design:plus-outlined" />
            新增调整
          </a-button>
        </a-space>
      </template>

      <a-card title="积分流水">
        <a-form layout="inline" style="margin-bottom: 12px">
          <a-form-item label="人员">
            <ApiSelect
              v-model:value="selectedStaffId"
              :api="staffOptionsApi"
              :params="searchParams"
              labelField="name"
              valueField="id"
              placeholder="请选择人员（可搜索姓名）"
              :filterOption="false"
              :showSearch="true"
              @search="onSearchStaff"
              style="min-width: 280px"
            />
          </a-form-item>
          <a-form-item>
            <a-button @click="reload">刷新</a-button>
          </a-form-item>
        </a-form>

        <div class="summary" v-if="selectedStaffId">
          <a-alert type="info" show-icon>
            <template #message>
              当前员工ID：<b>{{ selectedStaffId }}</b>，当前总积分：<b>{{ totalPoints }}</b>
            </template>
          </a-alert>
        </div>

        <BasicTable @register="registerTable" />
      </a-card>

      <!-- 新增/调整积分 抽屉 -->
      <BasicDrawer
        v-model:open="adjustDrawerVisible"
        title="新增积分调整"
        :width="560"
        showFooter
        :mask-closable="false"
        :destroy-on-close="true"
      >
        <BasicForm @register="registerAdjustForm" />
        <template #footer>
          <a-space>
            <a-button @click="closeAdjustDrawer">取消</a-button>
            <a-button type="primary" :loading="submitLoading" @click="submitAdjust">提交调整</a-button>
          </a-space>
        </template>
      </BasicDrawer>
    </PageWrapper>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { PageWrapper } from '/@/components/Page';
  import { BasicForm, useForm, FormSchema, ApiSelect } from '/@/components/Form';
  import { BasicTable, useTable } from '/@/components/Table';
  import { Icon } from '/@/components/Icon';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { BasicDrawer } from '/@/components/Drawer';
  import { getStaffList, getStaffPointsSummary, getStaffPointsLogs, adjustStaffPoints } from './staff.api';

  const route = useRoute();
  const router = useRouter();
  const { createMessage } = useMessage();

  const submitLoading = ref(false);
  const selectedStaffId = ref<string>('');
  const totalPoints = ref<number>(0);
  const searchParams = ref<Record<string, any>>({});
  const adjustDrawerVisible = ref(false);

  // 远程人员选项接口（返回 [{id,name}] 数组，便于 ApiSelect 使用）
  const staffOptionsApi = async (params?: Record<string, any>) => {
    try {
      const res = await getStaffList({ pageNo: 1, pageSize: 50, ...(params || {}) });
      const list = (res && (res.list || res.records)) || [];
      return list.map((item: any) => ({ id: item.id, name: item.name }));
    } catch (e) {
      console.warn('获取人员选项失败:', e);
      return [];
    }
  };

  function onSearchStaff(val: string) {
    searchParams.value = { name: val };
  }

  // 抽屉内表单配置
  const formSchema: FormSchema[] = [
    {
      label: '人员',
      field: 'staffId',
      component: 'ApiSelect',
      required: true,
      componentProps: {
        api: staffOptionsApi,
        showSearch: true,
        filterOption: false,
        onSearch: (val: string) => {
          searchParams.value = { name: val };
        },
        params: searchParams,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择人员（可搜索姓名）',
      },
    },
    {
      label: '积分变动',
      field: 'delta',
      component: 'InputNumber',
      required: true,
      componentProps: {
        min: -9999,
        max: 9999,
        step: 1,
        placeholder: '请输入变动积分（支持负数）',
      },
      rules: [
        { required: true, message: '请输入变动积分' },
        {
          validator: (_, value) => {
            if (value === 0 || value === null || value === undefined) return Promise.reject('积分不能为 0');
            return Promise.resolve();
          },
        },
      ],
    },
    {
      label: '原因备注',
      field: 'remark',
      component: 'InputTextArea',
      componentProps: {
        rows: 3,
        maxlength: 500,
        showCount: true,
        placeholder: '请输入积分调整原因（可选）',
      },
    },
    {
      label: '事件类型',
      field: 'eventType',
      component: 'Select',
      componentProps: {
        options: [
          { label: '手动调整', value: 'MANUAL_ADJUST' },
          { label: '其他', value: 'OTHER' },
        ],
        allowClear: true,
      },
    },
    {
      label: '来源类型',
      field: 'sourceType',
      component: 'Select',
      componentProps: {
        options: [
          { label: 'APP', value: 'APP' },
          { label: 'PROJECT', value: 'PROJECT' },
          { label: 'COMPONENT', value: 'COMPONENT' },
          { label: 'OTHER', value: 'OTHER' },
        ],
        allowClear: true,
      },
    },
  ];

  const [registerAdjustForm, { validate: validateAdjust, setFieldsValue: setAdjustFieldsValue, resetFields }] = useForm({
    labelWidth: 120,
    showActionButtonGroup: false,
    schemas: formSchema,
    baseColProps: { lg: 24, md: 24 },
  });

  // 积分流水表格
  const [registerTable, { reload, setProps }] = useTable({
    title: '积分流水',
    immediate: false,
    columns: [
      { title: '事件类型', dataIndex: 'eventType', width: 160 },
      { title: '来源类型', dataIndex: 'sourceType', width: 120 },
      { title: '来源名称', dataIndex: 'sourceName', width: 200 },
      { title: '变动积分', dataIndex: 'delta', width: 100 },
      { title: '备注', dataIndex: 'remark', width: 240 },
      { title: '创建时间', dataIndex: 'createTime', width: 180 },
    ],
    api: async (params) => {
      if (!selectedStaffId.value) return { items: [], total: 0 } as any;
      const { page = 1, pageSize = 10 } = params || {};
      const res = await getStaffPointsLogs(selectedStaffId.value, { pageNo: page, pageSize });
      const list = (res && (res.records || res.list)) || [];
      const total = (res && (res.total || list.length)) || 0;
      return { items: list, total } as any;
    },
    rowKey: 'id',
    useSearchForm: false,
    showTableSetting: true,
    pagination: true,
  });

  async function loadSummary() {
    if (!selectedStaffId.value) {
      totalPoints.value = 0;
      return;
    }
    try {
      const res = await getStaffPointsSummary(selectedStaffId.value);
      const total = (res && (res.totalPoints ?? res)) ?? 0;
      totalPoints.value = Number(total) || 0;
    } catch (error) {
      console.warn('获取积分摘要失败:', error);
      totalPoints.value = 0;
    }
  }

  async function submitAdjust() {
    try {
      submitLoading.value = true;
      const values = await validateAdjust();
      const { staffId, delta, remark, sourceType, eventType } = values as any;
      selectedStaffId.value = staffId;
      await adjustStaffPoints(staffId, Number(delta), remark, { sourceType, eventType });
      createMessage.success('调整成功');
      await loadSummary();
      reload();
      closeAdjustDrawer();
    } catch (error: any) {
      console.error('调整失败:', error);
      createMessage.error(error?.message || '调整失败，请稍后重试');
    } finally {
      submitLoading.value = false;
    }
  }

  function openAdjustDrawer() {
    adjustDrawerVisible.value = true;
    // 预填充人员
    setTimeout(() => {
      if (selectedStaffId.value) {
        setAdjustFieldsValue({ staffId: selectedStaffId.value });
      } else {
        resetFields();
      }
    });
  }

  function closeAdjustDrawer() {
    adjustDrawerVisible.value = false;
  }

  function goBack() {
    router.push('/staff/list');
  }

  // 路由参数预填充
  onMounted(async () => {
    const qsId = (route.query.staffId as string) || '';
    if (qsId) {
      selectedStaffId.value = qsId;
      await loadSummary();
      reload();
    }
  });

  watch(selectedStaffId, () => {
    loadSummary();
    reload();
  });
</script>

<style lang="less" scoped>
  .summary {
    margin-bottom: 12px;
  }
</style>