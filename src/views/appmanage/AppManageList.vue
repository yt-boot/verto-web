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
    
    <!-- 应用详情（全屏Modal） -->
    <AppManageDetail v-if="detailVisible" :appId="detailAppId" @closed="detailVisible = false" />
  </div>
  
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { BasicTable, useTable, TableAction } from '/@/components/Table';
  import { useDrawer } from '/@/components/Drawer';
  import AppManageModal from './components/AppManageModal.vue';
  import AppManageDetail from './AppManageDetail.vue';
  import { getAppList, deleteApp, getDomainDict, getActiveStaffList, getUserList } from './AppManage.api';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useRouter } from 'vue-router';
  import type { AppManageModel } from './AppManage.data';

  export default defineComponent({
    name: 'AppManageList',
    components: { BasicTable, TableAction, AppManageModal, AppManageDetail },
    setup() {
      const router = useRouter();
      const { createMessage } = useMessage();
      const [registerDrawer, { openDrawer }] = useDrawer();
      
      // 初始加载时不再预获取映射数据，改为在listApp接口中获取
      
      // 详情弹窗控制
      const detailVisible = ref(false);
      const detailAppId = ref('');

      // 列定义
      const columns = [
        { title: '应用简称', dataIndex: 'appName', key: 'appName', width: 180 },
        { 
          title: '所属领域', 
          dataIndex: 'domain_dictText', 
          key: 'domain', 
          width: 120
        },
        { 
          title: '创建人', 
          dataIndex: 'createBy_dictText', 
          key: 'createBy', 
          width: 120
        },
        { 
          title: '应用负责人', 
          dataIndex: 'managers_dictText', 
          key: 'managers', 
          width: 160
        },
        { title: '描述', dataIndex: 'appDescription', key: 'appDescription', ellipsis: true },
      ];

      // 缓存：领域字典与人员映射
    const domainMapRef = ref<Map<string, string>>(new Map());
    const staffIdToNameRef = ref<Map<string, string>>(new Map());
    const staffUsernameToNameRef = ref<Map<string, string>>(new Map());
    // 系统用户（用于 createBy、managers 的用户名/用户ID 映射）
    const userIdToNameRef = ref<Map<string, string>>(new Map());
    const userUsernameToNameRef = ref<Map<string, string>>(new Map());
    
    // 初始化映射数据的函数已移除，改为在listApp接口中按需获取映射数据

      async function ensureDomainMap() {
        if (domainMapRef.value.size > 0) return;
        try {
          const resp = await getDomainDict();
          const items = resp?.result || resp || [];
          const map = new Map<string, string>();
          (items || []).forEach((it: any) => {
            if (it && (it.value != null)) {
              map.set(String(it.value), it.text || it.label || it.title || String(it.value));
            }
          });
          domainMapRef.value = map;
        } catch (e) {
          console.warn('加载领域字典失败', e);
        }
      }

      async function ensureStaffMaps() {
          // 简化的staff映射获取逻辑
          try {
            const res = await getActiveStaffList({ pageNo: 1, pageSize: 1000 });
            const rows = res?.records || [];
            const id2name = new Map<string, string>();
            const username2name = new Map<string, string>();
            rows.forEach((u: any) => {
              if (!u) return;
              const id = u.id != null ? String(u.id) : undefined;
              const username = u.username != null ? String(u.username) : undefined;
              const name = u.name || '';
              if (id) id2name.set(id, name);
              if (username) username2name.set(username, name);
            });
            console.log(id2name,username2name,'staffIdToNameRef====')
            staffIdToNameRef.value = id2name;
            staffUsernameToNameRef.value = username2name;
          } catch (e) {
            console.warn('加载人员列表失败', e);
          }
        }

      async function ensureUserMaps() {
          // 简化的user映射获取逻辑
          try {
            const res = await getUserList({ pageNo: 1, pageSize: 1000 });
            const rows = res?.result?.records || res?.result || [];
            const id2name = new Map<string, string>();
            const username2name = new Map<string, string>();
            
            (rows || []).forEach((u: any) => {
              if (!u) return;
              const id = u.id != null ? String(u.id) : undefined;
              const username = u.username != null ? String(u.username) : undefined;
              const name = u.realname || u.name || u.nickname || u.label || u.text || username || id || '';
              if (id) id2name.set(id, name);
              if (username) username2name.set(username, name);
            });
            
            userIdToNameRef.value = id2name;
            userUsernameToNameRef.value = username2name;
          } catch (e) {
            console.warn('加载系统用户列表失败', e);
          }
        }

      // 处理记录，添加映射后的文本字段
      function processRecordsWithMaps(rows: AppManageModel[]): AppManageModel[] {
        const domainMap = domainMapRef.value;
        // 合并 staff 和 user 两类映射，优先使用staff数据
        const id2name = new Map([...staffIdToNameRef.value, ...userIdToNameRef.value]);
        const username2name = new Map([...staffUsernameToNameRef.value, ...userUsernameToNameRef.value]);
        
        return (rows || []).map((r: any) => {
          // 处理领域文本
          const domainCode = r?.domain != null ? String(r.domain) : '';
          const domainText = domainMap.get(domainCode) || domainCode || '未分类';
          
          // 处理应用负责人文本
          const managersRaw = r?.managers;
          const idsArr = Array.isArray(managersRaw)
            ? managersRaw
            : String(managersRaw || '').split(',').map(s => s.trim()).filter(Boolean);
         console.log(idsArr,'idsArr')
            const managersText = idsArr
            .map((key: any) => {
              const k = String(key);
              return id2name.get(k) || username2name.get(k) || k;
            })
            .join(', ') || '-';
          
          // 处理创建者文本
          const createByKey = r?.createBy != null ? String(r.createBy) : '';
          const createByText = username2name.get(createByKey) || id2name.get(createByKey) || createByKey || '-';
         console.log(id2name,username2name,'id2name,username2name')
          console.log(managersText,'managersText')
          return {
            ...r,
            domain_dictText: domainText,
            managers_dictText: managersText,
            createBy_dictText: createByText
          };
        });
      }

      // 数据查询并处理映射关系
      async function listApp(params: Recordable): Promise<{ records: AppManageModel[]; total: number }> {
        // 获取应用列表数据
        const res = await getAppList(params);
        if (res && res.success) {
          const r = res.result || {};
          const rawRecords = r.records || [];
          
          // 获取所有必要的映射数据
          await Promise.all([ensureDomainMap(), ensureStaffMaps(), ensureUserMaps()]);
          
          // 处理id与name的映射，生成增强后的记录
          const enhancedRecords = processRecordsWithMaps(rawRecords);
          
          return { records: enhancedRecords, total: r.total || rawRecords.length || 0 };
      }
      createMessage.error(res?.message || '加载数据失败');
      return { records: [], total: 0 };
    }

    const [registerTable, { reload }] = useTable({
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
        detailAppId.value = String(record.id);
        detailVisible.value = true;
      }

      function handleDeleteClick(record: AppManageModel) {
        deleteApp({ id: record.id }, () => {
          // createMessage.success('删除成功');
          reload();
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
        reload()
      }

      return {
      registerTable,
      registerDrawer,
      detailVisible,
      detailAppId,
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