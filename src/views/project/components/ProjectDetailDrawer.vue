<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    :title="drawerTitle"
    width="980px"
    destroyOnClose
  >
    <ProjectDetail :projectId="innerProjectId" :hidePipelineTab="true" />
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import ProjectDetail from '../ProjectDetail.vue';

const innerProjectId = ref<string>('');
const drawerTitle = ref<string>('项目详情');

const [registerDrawer] = useDrawerInner(async (data) => {
  innerProjectId.value = String(data?.projectId || '');
  const titleFromRecord = data?.record?.title || data?.title;
  drawerTitle.value = titleFromRecord ? `项目详情 - ${titleFromRecord}` : '项目详情';
});
</script>

<style scoped>
</style>