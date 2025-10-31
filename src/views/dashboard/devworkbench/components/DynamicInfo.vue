<template>
  <Card title="最新动态" v-bind="$attrs">
    <template #extra>
      <a-button type="link" size="small" @click="goMore">更多</a-button>
    </template>
    <div v-if="loadingLocal">
      <Skeleton active :paragraph="{ rows: 3 }" />
    </div>
    <Empty v-else-if="!items.length" />
    <List v-else item-layout="horizontal" :data-source="items">
      <template #renderItem="{ item }">
        <ListItem>
          <ListItemMeta>
            <template #description>
              {{ item.date }}
            </template>
            <!-- eslint-disable-next-line -->
            <template #title> {{ item.name }} <span v-html="item.desc"> </span> </template>
            <template #avatar>
              <Icon :icon="item.avatar" :size="30" />
            </template>
          </ListItemMeta>
        </ListItem>
      </template>
    </List>
  </Card>
</template>
<script lang="ts" setup>
  import { Card, List, Skeleton, Empty } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { onMounted, ref } from 'vue';
  import { getDynamicInfoList, type DynamicInfoItem } from '../devworkbench.api';
  import { useRouter } from 'vue-router';

  const ListItem = List.Item;
  const ListItemMeta = List.Item.Meta;

  const items = ref<DynamicInfoItem[]>([]);
  const loadingLocal = ref(true);
  const router = useRouter();

  onMounted(async () => {
    try {
      const res = await getDynamicInfoList({ pageSize: 10 });
      items.value = Array.isArray(res) ? res : [];
    } catch (error) {
      // 获取失败时显示为空列表即可
      items.value = [];
      // 可选：在此添加错误提示
      // console.error('获取最新动态失败', error);
    }
    loadingLocal.value = false;
  });

  const goMore = () => {
    router.push('/devworkbench/dynamic');
  };
</script>