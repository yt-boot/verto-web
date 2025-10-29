<template>
  <div>
    <!--引用表格-->
    <BasicTable @register="registerTable" :rowSelection="rowSelection">
      <!--插槽:table标题-->
      <template #tableTitle>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreate"> 新增</a-button>
        <a-dropdown v-if="selectedRowKeys.length > 0">
          <template #overlay>
            <a-menu>
              <a-menu-item key="1" @click="batchHandleDelete">
                <Icon icon="ant-design:delete-outlined"></Icon>
                删除
              </a-menu-item>
            </a-menu>
          </template>
          <a-button>
            批量操作
            <Icon icon="mdi:chevron-down"></Icon>
          </a-button>
        </a-dropdown>
      </template>
      <!--操作栏-->
      <template #action="{ record }">
        <TableAction :actions="getTableAction(record)" />
      </template>
    </BasicTable>
    <!-- 人员抽屉：新增 / 编辑 / 查看 -->
    <StaffDrawer @register="registerDrawer" @success="handleSuccess" />

    <!-- 积分流水抽屉 -->
    <BasicDrawer
      v-model:open="pointsDrawerVisible"
      :title="pointsDrawerTitle"
      :width="720"
      showFooter
      :showOkBtn="false"
      :showCancelBtn="true"
      :destroy-on-close="true"
    >
      <BasicTable @register="registerPointsTable" />
    </BasicDrawer>
  </div>
</template>

<script lang="ts" name="system-staff" setup>
  import { ref, computed, unref } from 'vue';
  import { BasicTable, TableAction, ActionItem } from '/@/components/Table';
  import { useTable } from '/@/components/Table';
  import { Icon } from '/@/components/Icon';
  import StaffDrawer from './StaffDrawer.vue';
  import { useDrawer } from '/@/components/Drawer';
  import { BasicDrawer } from '/@/components/Drawer';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useListPage } from '/@/hooks/system/useListPage';
  import { columns, searchFormSchema, StaffModel } from './staff.data';
  import { getStaffList, deleteStaff, batchDeleteStaff, getImportUrl, getExportUrl, getStaffPointsLogs } from './staff.api';

  const { createMessage, createConfirm } = useMessage();
  // 注册抽屉
  const [registerDrawer, { openDrawer, setDrawerProps }] = useDrawer();

  // 列表页面公共参数、方法
  const { prefixCls, tableContext, onExportXls, onImportXls } = useListPage({
    designScope: 'staff-list',
    tableProps: {
      title: '人员管理',
      api: getStaffList,
      columns: columns,
      size: 'small',
      formConfig: {
        schemas: searchFormSchema,
      },
      useSearchForm: true,
      showTableSetting: true,
      tableSetting: {
        fullScreen: true,
      },
      actionColumn: {
        width: 300,
        title: '操作',
        dataIndex: 'action',
        slots: { customRender: 'action' },
      },
      beforeFetch: (params) => {
        return Object.assign({ column: 'createTime', order: 'desc' }, params);
      },
    },
    exportConfig: {
      name: '人员管理',
      url: getExportUrl,
    },
    importConfig: {
      url: getImportUrl,
    },
  });

  // 注册table数据
  const [registerTable, { reload }, { rowSelection, selectedRows, selectedRowKeys }] = tableContext;

  // 积分流水抽屉相关
  const pointsDrawerVisible = ref(false);
  const pointsDrawerTitle = ref('积分流水');
  const currentStaffForPoints = ref<StaffModel | null>(null);
  const [registerPointsTable, { reload: reloadPointsTable }] = useTable({
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
      const staffId = currentStaffForPoints.value?.id;
      if (!staffId) {
        return { items: [], total: 0 } as any;
      }
      const { page = 1, pageSize = 10 } = params || {};
      const res = await getStaffPointsLogs(staffId, { pageNo: page, pageSize });
      const list = (res && (res.records || res.list)) || [];
      const total = (res && (res.total || list.length)) || 0;
      return { items: list, total } as any;
    },
    rowKey: 'id',
    useSearchForm: false,
    showTableSetting: true,
    pagination: true,
    size: 'small',
  });

  /**
   * 新增人员
   */
  function handleCreate() {
    setDrawerProps({ showFooter: true, showOkBtn: true, showCancelBtn: true, title: '新增人员' });
    openDrawer(true, { isUpdate: false });
  }

  /**
   * 编辑人员
   * @param record 人员记录
   */
  function handleEdit(record: StaffModel) {
    setDrawerProps({ showFooter: true, showOkBtn: true, showCancelBtn: true, title: '编辑人员' });
    openDrawer(true, { isUpdate: true, record });
  }

  /**
   * 查看人员详情
   * @param record 人员记录
   */
  function handleView(record: StaffModel) {
    setDrawerProps({ showFooter: true, showOkBtn: false, showCancelBtn: true, title: '人员详情' });
    openDrawer(true, { isView: true, record });
  }

  /**
   * 查看积分流水（抽屉）
   */
  function handleViewPoints(record: StaffModel) {
    currentStaffForPoints.value = record;
    pointsDrawerTitle.value = `积分流水 - ${record.name}`;
    pointsDrawerVisible.value = true;
    // 延迟触发加载，确保抽屉渲染完成
    setTimeout(() => reloadPointsTable());
  }

  /**
   * 积分管理
   * @param record 人员记录
   */
  function handlePointsManage(record: StaffModel) {
    // 保留原有跳转到积分管理页面的入口
    // router.push({ path: '/points/manage', query: { staffId: record.id } });
    setDrawerProps({ showFooter: false, title: '积分管理（请使用详情页入口）' });
    openDrawer(true, { isView: true, record });
  }

  /**
   * 删除人员
   * @param record 人员记录
   */
  function handleDelete(record: StaffModel) {
    deleteStaff({ id: record.id }, handleSuccess);
  }

  /**
   * 批量删除
   */
  function batchHandleDelete() {
    if (selectedRowKeys.value.length === 0) {
      createMessage.warning('请选择要删除的数据');
      return;
    }
    batchDeleteStaff({ ids: selectedRowKeys.value.join(',') }, handleSuccess);
  }

  /**
   * 成功回调
   */
  function handleSuccess() {
    selectedRowKeys.value = [];
    reload();
  }

  /**
   * 获取表格操作按钮
   * @param record 当前行记录
   */
  function getTableAction(record: StaffModel): ActionItem[] {
    return [
      {
        label: '查看',
        icon: 'ant-design:eye-outlined',
        onClick: handleView.bind(null, record),
      },

      {
        label: '积分流水',
        icon: 'ant-design:file-search-outlined',
        onClick: handleViewPoints.bind(null, record),
      },

      {
        label: '编辑',
        icon: 'clarity:note-edit-line',
        onClick: handleEdit.bind(null, record),
      },
      {
        label: '删除',
        icon: 'ant-design:delete-outlined',
        color: 'error',
        popConfirm: {
          title: '是否确认删除',
          placement: 'left',
          confirm: handleDelete.bind(null, record),
        },
      },
    ];
  }
</script>

<style scoped>
  .ant-btn {
    margin-right: 8px;
  }
</style>
