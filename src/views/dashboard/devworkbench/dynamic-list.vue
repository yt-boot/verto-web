<template>
  <PageWrapper title="动态列表">
    <Card>
      <template #title>最新动态</template>
      <div v-if="loadingLocal">
        <a-skeleton active :paragraph="{ rows: 5 }" />
      </div>
      <a-empty v-else-if="!items.length" />
      <List v-else item-layout="horizontal" :data-source="items">
        <template #renderItem="{ item }">
          <ListItem>
            <ListItemMeta>
              <template #description>
                {{ item.date }}
              </template>
              <template #title>
                {{ item.name }} <span v-html="item.desc"></span>
              </template>
              <template #avatar>
                <Icon :icon="item.avatar" :size="30" />
              </template>
            </ListItemMeta>
          </ListItem>
        </template>
      </List>
    </Card>
  </PageWrapper>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { Card, List } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { getDynamicInfoList, type DynamicInfoItem } from './devworkbench.api';

  const ListItem = List.Item;
  const ListItemMeta = List.Item.Meta;

  const items = ref<DynamicInfoItem[]>([]);
  const loadingLocal = ref(true);

  onMounted(async () => {
    try {
      const res = await getDynamicInfoList({ pageSize: 50 });
      items.value = Array.isArray(res) ? res : [];
    } catch (error) {
      items.value = [];
    }
    loadingLocal.value = false;
  });
</script>

<style scoped>
</style>