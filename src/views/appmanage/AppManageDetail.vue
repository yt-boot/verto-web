<!--应用管理详情页面-->
<template>
  <BasicModal
    @register="registerDetailModal"
    :title="appDetail?.appName || '应用详情'"
    :defaultFullscreen="true"
    :canFullscreen="false"
    :maskClosable="false"
    :closable="true"
    :draggable="false"
    :footer="null"
    @visible-change="handleVisibleChange"
    class="app-manage-detail-modal"
  >
    <div class="app-detail">

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" />
      </div>

      <!-- 详情内容 -->
      <div v-else-if="appDetail" class="detail-content">

        <!-- Tab页面内容 -->
        <a-card class="tab-container">
          <a-tabs v-model:activeKey="activeTabKey" type="card" @change="handleTabChange">
            <a-tab-pane v-for="tab in tabList" :key="tab.key" :tab="tab.name">
              <component :is="tab.component" :app-detail="appDetail" :app-id="appDetail.id" @switchToConfig="handleSwitchToConfig" />
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </div>

      <!-- 数据不存在 -->
      <div v-else class="no-data">
        <a-empty description="应用不存在或已被删除" />
      </div>

      <!-- 编辑抽屉 -->
      <AppManageModal @register="registerDrawer" @success="handleSuccess"></AppManageModal>
    </div>
  </BasicModal>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, defineExpose, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { Card, Button, Row, Col, Spin, Tag, message, Tabs, TabPane, Avatar } from 'ant-design-vue';
  import Icon from '/@/components/Icon';
  import { useDrawer } from '/@/components/Drawer';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useClipboard } from '@vueuse/core';
  import { formatToDateTime } from '/@/utils/dateUtil';
  import { getAppById, deleteApp, getAppStatistics } from './AppManage.api';
  import AppManageModal from './components/AppManageModal.vue';
  import BasicInfo from './components/BasicInfo.vue';
  // import ProjectList from './components/ProjectList.vue';
  import AppConfig from './components/AppConfig.vue';
  import Statistics from './components/Statistics.vue';
  import { appDetailTabs as tabList } from './components/AppDetailTabs.data';

  export default defineComponent({
    name: 'AppManageDetail',
    emits: ['closed'],
    components: {
      ACard: Card,
      AButton: Button,
      ARow: Row,
      ACol: Col,
      ASpin: Spin,
      ATag: Tag,
      ATabs: Tabs,
      ATabPane: TabPane,
      AAvatar: Avatar,
      Icon,
      BasicModal,
      AppManageModal,
      BasicInfo,
      // ProjectList,
      AppConfig,
      Statistics,
    },
    props: {
      // 当不通过路由展示时，可以直接传入 appId
      appId: { type: String, default: '' },
    },
    setup(props, { emit }) {
      const route = useRoute();
      const router = useRouter();

      // 抽屉
      const [registerDrawer, { openDrawer }] = useDrawer();

      // 详情全屏弹窗 - 使用 useModalInner 作为内部组件
      const [registerDetailModal, { setModalProps, redoModalHeight }] = useModalInner((data) => {
        // 弹窗打开时触发，加载数据
        if (data && data.appId) {
          // 如果传入了appId，则加载详情
          currentAppId.value = data.appId;
          loadAppDetail();
          loadAppStatistics();
        }
      });

      // 监听props变化，自动加载数据
      watch(() => props.appId, (newAppId) => {
        if (newAppId) {
          currentAppId.value = newAppId;
          loadAppDetail();
          loadAppStatistics();
        }
      });

      // 剪贴板
      const { copy, copied: copiedRef } = useClipboard();
      const clipboardRef = ref('');

      // 响应式数据
      const loading = ref(false);
      const appDetail = ref<any>(null);
      const activeTabKey = ref('basic');
      // 本地响应式appId，用于存储当前操作的应用ID
      const currentAppId = ref(props.appId);

      // 统计数据
      const projectCount = ref(12);
      const commitCount = ref(1234);
      const deployCount = ref(89);

      /**
       * 加载应用详情
       */
      const loadAppDetail = async () => {
        const appId = (route.params.id as string) || currentAppId.value;
        if (!appId) {
          message.error('应用ID不能为空');
          return;
        }

        loading.value = true;
        try {
          const result = await getAppById({ id: appId });
          if (result.success) {
            appDetail.value = result.result;
          } else {
            message.error(result.message || '加载应用详情失败');
          }
        } catch (error) {
          console.error('加载应用详情失败:', error);
          message.error('加载应用详情失败');
        } finally {
          loading.value = false;
        }
      };

      /**
       * 加载应用统计数据
       */
      const loadAppStatistics = async () => {
        const appId = (route.params.id as string) || currentAppId.value;
        if (!appId) {
          return;
        }

        try {
          const result = await getAppStatistics(appId);
          if (result.success && result.result) {
            projectCount.value = result.result.projectCount || 0;
            commitCount.value = result.result.commitCount || 0;
            deployCount.value = result.result.deployCount || 0;
          } else {
            console.warn('获取统计数据失败:', result.message);
            // 保持默认值，不显示错误信息
          }
        } catch (error) {
          console.error('加载应用统计数据失败:', error);
          // 保持默认值，不显示错误信息
        }
      };

      /**
       * 返回列表
       */
      const goBack = () => {
        console.log('goBack 方法被调用');
        // 关闭全屏详情弹窗
        setModalProps({ visible: false });
        // 通知父组件已关闭，用于卸载组件
        emit('closed');
        // 如果当前是通过详情路由打开，则回到列表页
        const path = router.currentRoute.value?.path || '';
        if (path.includes('/appmanage/detail') || path.includes('/appmanage/view')) {
          router.push('/appmanage');
        }
      };

      /**
       * 编辑应用
       */
      const handleEdit = () => {
        if (!appDetail.value) return;
        openDrawer(true, {
          record: appDetail.value,
          isUpdate: true,
        });
      };

      /**
       * 删除应用
       */
      const handleDelete = () => {
        if (!appDetail.value) return;
        deleteApp({ id: appDetail.value.id }, () => {
          message.success('删除成功');
          goBack();
        });
      };

      /**
       * 打开Git仓库
       */
      const openGitRepo = () => {
        if (appDetail.value?.gitUrl) {
          window.open(appDetail.value.gitUrl, '_blank');
        }
      };

      /**
       * 复制Git地址
       */
      const copyGitUrl = async () => {
        if (appDetail.value?.gitUrl) {
          clipboardRef.value = appDetail.value.gitUrl;
          if (copiedRef.value) {
            createMessage.success('Git地址已复制到剪贴板');
          } else {
            createMessage.error('复制失败');
          }
        }
      };

      /**
       * 格式化日期
       */
      const formatDate = (date: string) => {
        return date ? formatToDateTime(date) : '暂无';
      };

      /**
       * 编辑成功回调
       */
      const handleSuccess = () => {
        loadAppDetail();
      };

      /**
       * Tab切换处理
       */
      const handleTabChange = (key: string) => {
        activeTabKey.value = key;
      };

      /**
       * 处理配置切换事件
       * @param configType 配置类型
       */
      const handleSwitchToConfig = (configType: string) => {
        // 根据配置类型切换到对应的Tab
        if (configType === 'pipeline') {
          activeTabKey.value = 'pipelineConfig';
        }
        // 可以根据需要添加其他配置类型的处理
      };

      // 组件挂载时加载数据
      onMounted(() => {
        // 不再默认打开弹窗，由父组件控制
        if (props.appId) {
          loadAppDetail();
          loadAppStatistics();
        }
      });

      /**
       * 处理弹窗显示状态变化
       */
      const handleVisibleChange = (visible: boolean) => {
        console.log('弹窗状态变化:', visible);
        if (visible && currentAppId.value) {
          loadAppDetail();
          loadAppStatistics();
        }
      };

      /**
       * 暴露方法给父组件
       */
      defineExpose({
        setModalProps,
        loadAppDetail,
        handleVisibleChange
      });

      return {
        loading,
        appDetail,
        activeTabKey,
        tabList,
        projectCount,
        commitCount,
        deployCount,
        currentAppId,
        registerDrawer,
        registerDetailModal,
        setModalProps,
        goBack,
        handleEdit,
        handleDelete,
        handleTabChange,
        openGitRepo,
        copyGitUrl,
        formatDate,
        handleSuccess,
        handleSwitchToConfig,
        handleVisibleChange
      };
    },
  });
</script>

<style lang="less" scoped>
  .app-detail {
    padding: 24px;
    background-color: #f0f2f5;
    min-height: calc(100vh - 64px);

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0;
        font-size: 16px;
        color: #1890ff;

        &:hover {
          color: #40a9ff;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;
    }

    .detail-content {
      .app-overview-card {
        margin-bottom: 24px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        .app-overview {
          display: flex;
          align-items: center;
          gap: 24px;

          .app-avatar {
            flex-shrink: 0;
          }

          .app-info {
            flex: 1;

            .app-title {
              margin: 0 0 8px 0;
              font-size: 24px;
              font-weight: 600;
              color: #262626;
            }

            .app-desc {
              margin: 0 0 12px 0;
              color: #595959;
              font-size: 14px;
              line-height: 1.5;
            }

            .app-tags {
              display: flex;
              gap: 8px;
            }
          }

          .app-stats {
            display: flex;
            gap: 32px;

            .stat-item {
              text-align: center;

              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #1890ff;
                margin-bottom: 4px;
              }

              .stat-label {
                font-size: 12px;
                color: #8c8c8c;
              }
            }
          }
        }
      }

      .tab-container {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        :deep(.ant-tabs-card) {
          .ant-tabs-tab {
            border-radius: 6px 6px 0 0;
            border: 1px solid #d9d9d9;
            background: #fafafa;
            margin-right: 2px;

            &.ant-tabs-tab-active {
              background: white;
              border-bottom-color: white;
            }
          }

          .ant-tabs-content-holder {
            border: 1px solid #d9d9d9;
            border-top: none;
            border-radius: 0 0 6px 6px;
            background: white;
          }

          .ant-tabs-tabpane {
            padding: 24px;
          }
        }
      }

      .detail-card {
        margin-bottom: 24px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        :deep(.ant-card-head) {
          border-bottom: 1px solid #f0f0f0;

          .ant-card-head-title {
            font-size: 18px;
            font-weight: 600;
            color: #262626;
          }
        }

        :deep(.ant-card-body) {
          padding: 24px;
        }
      }

      .info-item {
        margin-bottom: 16px;
        display: flex;
        align-items: flex-start;

        .info-label {
          min-width: 100px;
          font-weight: 500;
          color: #595959;
          margin-right: 12px;
        }

        .info-value {
          flex: 1;
          color: #262626;
          word-break: break-all;
        }

        .git-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1890ff;
          text-decoration: none;

          &:hover {
            color: #40a9ff;
            text-decoration: underline;
          }
        }
      }

      .git-info {
        .git-actions {
          margin-bottom: 16px;
          display: flex;
          gap: 12px;
        }

        .git-url {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background-color: #f5f5f5;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          color: #595959;
          word-break: break-all;
        }
      }
    }

    .no-data {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
</style>
