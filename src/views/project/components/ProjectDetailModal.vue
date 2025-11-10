<template>
  <BasicModal
    @register="registerDetailModal"
    :title="modalTitle"
    :defaultFullscreen="true"
    :canFullscreen="false"
    :maskClosable="false"
    :closable="true"
    :draggable="false"
    :footer="null"
    class="project-detail-fullscreen-modal"
  >
    <ProjectDetail :project-id="innerProjectId" />
  </BasicModal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import ProjectDetail from '../ProjectDetail.vue';

  export default defineComponent({
    name: 'ProjectDetailModal',
    components: { BasicModal, ProjectDetail },
    setup() {
      const innerProjectId = ref<string>('');
      const modalTitle = ref<string>('项目详情');

      // 通过 useModalInner 接收 openModal 传入的数据
      const [registerDetailModal] = useModalInner((data) => {
        // 支持两种方式传入：data.id 或 data.projectId
        innerProjectId.value = (data?.projectId as string) || (data?.id as string) || '';
        // 标题附加 ID 以便识别
        modalTitle.value = `项目详情 ${innerProjectId.value ? `#${innerProjectId.value}` : ''}`;
      });

      return {
        innerProjectId,
        modalTitle,
        registerDetailModal,
      };
    },
  });
</script>

<style scoped>
  .project-detail-fullscreen-modal {
    /* 允许内容滚动且占满空间 */
    height: 100%;
  }
</style>