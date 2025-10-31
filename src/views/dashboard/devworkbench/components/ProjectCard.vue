<template>
  <Card title="项目" v-bind="$attrs">
    <template #extra>
      <a-button type="link" size="small" @click="goMore">更多</a-button>
    </template>
    <div v-if="loadingLocal">
      <Skeleton active :paragraph="{ rows: 3 }" />
    </div>
    <Empty v-else-if="!items.length" />
    <template v-else v-for="item in items" :key="item.id || item.title">
      <CardGrid class="!md:w-full !w-full">
        <span class="flex">
          <Icon :icon="item.icon" :color="item.color" size="30" />
          <span class="text-lg ml-4">{{ item.title }}</span>
        </span>
        <div class="flex mt-2 h-10 text-secondary"> {{ item.desc }} </div>
        <div class="flex justify-between text-secondary">
          <span>{{ item.group }}</span>
          <span>{{ item.date }}</span>
        </div>
      </CardGrid>
    </template>
  </Card>
</template>
<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import { Card, Skeleton, Empty } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { getProjectList, type GroupItem } from '../devworkbench.api';
  import { useRouter } from 'vue-router';

  export default defineComponent({
    components: { Card, CardGrid: Card.Grid, Icon, Skeleton, Empty },
    setup() {
      const items = ref<GroupItem[]>([]);
      const loadingLocal = ref(true);
      const router = useRouter();

      onMounted(async () => {
        try {
          const res = await getProjectList({ pageSize: 6 });
          items.value = Array.isArray(res) ? res : [];
        } catch (error) {
          items.value = [];
        }
        loadingLocal.value = false;
      });

      const goMore = () => {
        router.push('/project/list');
      };

      return { items, loadingLocal, goMore };
    },
  });
</script>