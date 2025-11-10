import type { AppRouteModule } from '/@/router/types';
import { LAYOUT } from '/@/router/constant';

const appmanage: AppRouteModule = {
  path: '/appmanage',
  name: 'AppManage',
  component: LAYOUT,
  redirect: '/appmanage/list',
  meta: {
    orderNo: 100,
    icon: 'ant-design:appstore-outlined',
    title: '应用管理',
  },
  children: [
    {
      path: 'list',
      name: 'AppManageList',
      component: () => import('/@/views/appmanage/AppManageList.vue'),
      meta: {
        title: '应用列表',
        hideMenu: false,
      },
    },
    {
      path: 'detail/:id',
      name: 'AppManageDetail',
      component: () => import('/@/views/appmanage/AppManageDetail.vue'),
      meta: {
        title: '应用详情',
        hideMenu: true,
        hideTab: false,
      },
    },
  ],
};

export default appmanage;
