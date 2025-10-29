import type { AppRouteModule } from '/@/router/types';
import { LAYOUT } from '/@/router/constant';

// 开发工作台作为独立的顶级菜单路由
const devWorkbench: AppRouteModule = {
  path: '/devworkbench',
  name: 'DevWorkbenchRoot',
  component: LAYOUT,
  redirect: '/devworkbench/index',
  meta: {
    orderNo: 20,
    icon: 'ant-design:gitlab-outlined',
    title: '开发工作台',
  },
  children: [
    {
      path: 'index',
      name: 'DevWorkbench',
      component: () => import('/@/views/dashboard/devworkbench/index.vue'),
      meta: {
        title: '开发工作台',
        // 单独菜单入口，避免在 Dashboard 下展示
        currentActiveMenu: '/devworkbench/index',
      },
    },
  ],
};

export default devWorkbench;