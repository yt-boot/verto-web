<!--应用管理列表（重构为 BasicTable）-->
<template>
  <div class="app-manage">
    <BasicTable @register="registerTable">
      <template #tableTitle>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreateApp">创建应用</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'domain'">
          <a-tag color="blue">{{ record.domain_dictText || '未分类' }}</a-tag>
        </template>
        <template v-if="column.key === 'createBy'">
          <span>{{ record.createBy_dictText || record.createBy }}</span>
        </template>
        <template v-if="column.key === 'managers'">
          <span>{{ record.managers_dictText || '-' }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:eye-outlined',
                tooltip: '查看详情',
                onClick: handleViewDetail.bind(null, record),
              },
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑',
                onClick: handleEditClick.bind(null, record),
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除',
                popConfirm: {
                  title: '是否确认删除',
                  placement: 'left',
                  confirm: handleDeleteClick.bind(null, record),
                },
              },
              {
                icon: 'simple-icons:gitlab',
                tooltip: '访问Git',
                onClick: handleOpenGit.bind(null, record.gitUrl),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>

    <!-- 应用管理抽屉 -->
    <AppManageModal @register="registerDrawer" @success="handleSuccess" />
  </div>
  
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { BasicTable, useTable, TableAction } from '/@/components/Table';
  import { useDrawer } from '/@/components/Drawer';
  import AppManageModal from './components/AppManageModal.vue';
  import { getAppList, deleteApp, getDomainDict } from './AppManage.api';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useRouter } from 'vue-router';
  import type { AppManageModel } from './AppManage.data';

  export default defineComponent({
    name: 'AppManageList',
    components: { BasicTable, TableAction, AppManageModal },
    setup() {
      const router = useRouter();
      const { createMessage } = useMessage();
      const [registerDrawer, { openDrawer }] = useDrawer();

      // 列定义
      const columns = [
        { title: '应用简称', dataIndex: 'appName', key: 'appName', width: 180 },
        { title: '所属领域', dataIndex: 'domain', key: 'domain', width: 120 },
        { title: '创建者', dataIndex: 'createBy', key: 'createBy', width: 120 },
        { title: '管理员', dataIndex: 'managers', key: 'managers', width: 160 },
        { title: '描述', dataIndex: 'appDescription', key: 'appDescription', ellipsis: true },
      ];

      // api 适配 BasicTable（返回 { records, total }）
      async function listApp(params: Recordable): Promise<{ records: AppManageModel[]; total: number }> {
        const res = await getAppList(params);
        if (res && res.success) {
          const r = res.result || {};
          return { records: r.records || [], total: r.total || 0 };
        }
        createMessage.error(res?.message || '加载数据失败');
        return { records: [], total: 0 };
      }

      const [registerTable] = useTable({
        title: '应用列表',
        api: listApp,
        columns,
        rowKey: 'id',
        useSearchForm: true,
        formConfig: {
          labelWidth: 120,
          schemas: [
            {
              field: 'appName',
              label: '应用简称',
              component: 'Input',
              componentProps: { placeholder: '请输入应用简称' },
              colProps: { span: 8 },
            },
            {
              field: 'domain',
              label: '所属领域',
              component: 'ApiSelect',
              componentProps: {
                api: getDomainDict,
                labelField: 'text',
                valueField: 'value',
                resultField: 'result',
                placeholder: '请选择所属领域',
                allowClear: true,
                showSearch: true,
              },
              colProps: { span: 8 },
            },
          ],
        },
        showTableSetting: true,
        bordered: true,
        actionColumn: { width: 220, title: '操作', dataIndex: 'action', key: 'action' },
      });

      function handleCreateApp() {
        openDrawer(true, { isUpdate: false });
      }

      function handleEditClick(record: AppManageModel) {
        openDrawer(true, { record, isUpdate: true });
      }

      function handleViewDetail(record: AppManageModel) {
        router.push(`/appmanage/detail/${record.id}`);
      }

      function handleDeleteClick(record: AppManageModel) {
        deleteApp({ id: record.id }, () => {
          createMessage.success('删除成功');
        });
      }

      function handleOpenGit(gitUrl: string) {
        if (gitUrl) {
          window.open(gitUrl, '_blank');
        } else {
          createMessage.warning('Git地址为空');
        }
      }

      function handleSuccess(result) {
        if (result && result.id) {
          router.push(`/appmanage/detail/${result.id}?tab=basic`);
        }
      }

      return {
        registerTable,
        registerDrawer,
        handleCreateApp,
        handleEditClick,
        handleViewDetail,
        handleDeleteClick,
        handleOpenGit,
        handleSuccess,
      };
    },
  });
</script>

<style lang="less" scoped>
  .app-manage {
    padding: 16px;
    background-color: #f0f2f5;
    min-height: calc(100vh - 64px);
  }
</style>