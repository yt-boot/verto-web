<template>
  <div>
    <!--引用表格-->
    <BasicTable @register="registerTable" :rowSelection="rowSelection">
      <!--插槽:table标题-->
      <template #tableTitle>
        <a-button type="primary" @click="handleAdd" preIcon="ant-design:plus-outlined"> 新增项目</a-button>
        <a-button type="primary" preIcon="ant-design:export-outlined" @click="onExportXls"> 导出</a-button>
        <j-upload-button type="primary" preIcon="ant-design:import-outlined" @click="onImportXls">导入</j-upload-button>
        <a-dropdown v-if="selectedRowKeys.length > 0">
          <template #overlay>
            <a-menu>
              <a-menu-item key="1" @click="batchHandleDelete">
                <Icon icon="ant-design:delete-outlined"></Icon>
                删除
              </a-menu-item>
            </a-menu>
          </template>
          <a-button>批量操作
            <Icon icon="mdi:chevron-down"></Icon>
          </a-button>
        </a-dropdown>
      </template>
      <!--操作栏-->
      <template #action="{ record }">
        <TableAction :actions="getTableAction(record)" />
      </template>
      <!--字段回显插槽-->
      <template #htmlSlot="{ text }">
        <div v-html="text"></div>
      </template>
      <!--省市区字段回显插槽-->
      <template #pcaSlot="{ text }">
        {{ getAreaTextByCode(text) }}
      </template>
      <template #fileSlot="{ text }">
        <span v-if="!text" style="font-size: 12px; font-style: italic;">无文件</span>
        <a-button v-else :ghost="true" type="primary" preIcon="ant-design:download-outlined" size="small" @click="downloadFile(text)">下载</a-button>
      </template>
    </BasicTable>
    <!-- 抽屉表单区域 -->
    <ProjectDrawer @register="registerDrawer" @success="handleSuccess" />
    <!-- 项目详情抽屉 -->
    <ProjectDetailDrawer @register="registerDetailDrawer" />
  </div>
</template>

<script lang="ts" name="project-list" setup>
  import { ref, computed, unref } from 'vue';
  import { BasicTable, useTable, TableAction } from '/@/components/Table';
  import { useDrawer } from '/@/components/Drawer';
  import { useListPage } from '/@/hooks/system/useListPage';
  import ProjectDrawer from './components/ProjectDrawer.vue';
  import ProjectDetailDrawer from './components/ProjectDetailDrawer.vue';
  import { columns, searchFormSchema } from './Project.data';
  import { 
    getProjectList, 
    deleteProject, 
    batchDeleteProject, 
    exportXls, 
    importExcel 
  } from './Project.api';
  import { downloadByData } from '/@/utils/file/download';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { getAreaTextByCode } from '/@/components/Form/src/utils/Area';

  const checkedKeys = ref<Array<string | number>>([]);
  const { createMessage } = useMessage();
  // const router = useRouter(); // 已改为全屏弹窗方式，不再使用路由跳转
  
  // 注册抽屉
  const [registerDrawer, { openDrawer }] = useDrawer();
  // 项目详情抽屉
  const [registerDetailDrawer, { openDrawer: openDetailDrawer }] = useDrawer();
  
  //注册table数据
  const { prefixCls, tableContext, onExportXls, onImportXls } = useListPage({
    tableProps: {
      title: '项目管理',
      api: getProjectList,
      columns,
      canResize: false,
      formConfig: {
        //labelWidth: 120,
        schemas: searchFormSchema,
        autoSubmitOnEnter: true,
      },
      actionColumn: {
        width: 220,
        fixed: 'right',
      },
    },
    exportApi: exportXls,
    importApi: importExcel,
  });

  const [registerTable, { reload }, { rowSelection, selectedRowKeys }] = tableContext;

  /**
   * 新增事件
   */
  function handleAdd() {
    console.log('点击新增按钮，打开抽屉表单');
    openDrawer(true, { isUpdate: false });
  }

  /**
   * 编辑事件
   */
  function handleEdit(record: Recordable) {
    console.log('点击编辑按钮，打开抽屉表单，记录ID:', record.id);
    openDrawer(true, { isUpdate: true, record });
  }

  /**
   * 详情
   */
  function handleDetail(record: Recordable) {
    console.log('点击详情按钮，准备以抽屉方式展示详情，记录ID:', record.id);
    openDetailDrawer(true, { projectId: record.id, record });
  }

  /**
   * 发布：跳转到已绑定的应用流水线
   */
  async function handlePublish(record: Recordable) {
    // 优先使用项目记录中的 appConfig.pipelineBinding
    let appCfg: any = record?.appConfig;
    if (typeof appCfg === 'string') {
      try { appCfg = JSON.parse(appCfg); } catch (e) { appCfg = {}; }
    }
    const bound = appCfg?.pipelineBinding;
    if (bound?.jobUrl) {
      window.open(bound.jobUrl, '_blank');
      return;
    }
    // 回退到本地存储的选择
    const projectId = String(record.id);
    const storageKey = `projectPipelineSelection:${projectId}`;
    const selectedId = localStorage.getItem(storageKey);
    if (!selectedId) {
      createMessage.warning('请先在新增/编辑表单中绑定流水线，或在详情页选择并保存流水线');
      return;
    }
    try {
      const { defHttp } = await import('/@/utils/http/axios');
      const res = await defHttp.get({
        url: '/verto/appmanage/pipeline/binding/list',
        params: { appId: record.relatedAppId },
      });
      const list = Array.isArray(res?.records) ? res.records : [];
      const binding = list.find((b: any) => String(b.id) === String(selectedId));
      if (binding?.jobUrl) {
        window.open(binding.jobUrl, '_blank');
      } else {
        createMessage.warning('未找到可跳转的流水线链接，请重新选择');
      }
    } catch (e) {
      createMessage.error('获取绑定流水线失败');
    }
  }

  /**
   * 删除事件
   */
  async function handleDelete(record) {
    await deleteProject({ id: record.id });
    createMessage.success('删除成功！');
    reload();
  }

  /**
   * 批量删除事件
   */
  async function batchHandleDelete() {
    await batchDeleteProject({ ids: selectedRowKeys.value });
    createMessage.success('删除成功！');
    reload();
  }

  /**
   * 成功回调
   */
  function handleSuccess() {
    reload();
  }

  /**
   * 操作栏
   */
  function getTableAction(record) {
    return [
      {
        label: '编辑',
        onClick: handleEdit.bind(null, record),
      },
      {
        label: '详情',
        onClick: handleDetail.bind(null, record),
      },
      {
        label: '发布',
        color: 'success',
        onClick: handlePublish.bind(null, record),
      },
      {
        label: '删除',
        color: 'error',
        popConfirm: {
          title: '是否确认删除该项目？',
          confirm: handleDelete.bind(null, record),
          placement: 'topLeft',
        },
      },
    ];
  }

  /**
   * 下载文件
   */
  function downloadFile(text) {
    if (!text) {
      createMessage.warning('无文件可下载');
      return;
    }
    if (text.indexOf(',') > 0) {
      text = text.substring(0, text.indexOf(','));
    }
    let url = text.split('_')[1];
    downloadByData(url, url);
  }
</script>

<style scoped>

</style>