import { MockMethod } from 'vite-plugin-mock';
import { resultSuccess } from './_util';

// 模拟：最新动态列表
const dynamicList = [
  {
    id: 1,
    avatar: 'dynamic-avatar-1|svg',
    name: '威廉',
    date: '刚刚',
    desc: `在 <a>开源组</a> 创建了项目 <a>Vue</a>`,
  },
  {
    id: 2,
    avatar: 'dynamic-avatar-2|svg',
    name: '艾文',
    date: '1个小时前',
    desc: `关注了 <a>威廉</a> `,
  },
  {
    id: 3,
    avatar: 'dynamic-avatar-3|svg',
    name: '克里斯',
    date: '1天前',
    desc: `发布了 <a>个人动态</a> `,
  },
  {
    id: 4,
    avatar: 'dynamic-avatar-4|svg',
    name: 'Jeecg',
    date: '2天前',
    desc: `发表文章 <a>如何编写一个Vite插件</a> `,
  },
  {
    id: 5,
    avatar: 'dynamic-avatar-5|svg',
    name: '皮特',
    date: '3天前',
    desc: `回复了 <a>杰克</a> 的问题 <a>如何进行项目优化？</a>`,
  },
];

// 模拟：项目列表
const projectList = [
  {
    id: 1,
    title: 'Github',
    icon: 'carbon:logo-github',
    color: '',
    desc: '不要等待机会，而要创造机会。',
    group: '开源组',
    date: '2024-01-01',
  },
  {
    id: 2,
    title: 'Vue',
    icon: 'ion:logo-vue',
    color: '#3fb27f',
    desc: '现在的你决定将来的你。',
    group: '算法组',
    date: '2024-01-03',
  },
  {
    id: 3,
    title: 'Html5',
    icon: 'ion:logo-html5',
    color: '#e18525',
    desc: '没有什么才能比努力更重要。',
    group: '上班摸鱼',
    date: '2024-01-05',
  },
  {
    id: 4,
    title: 'Angular',
    icon: 'ion:logo-angular',
    color: '#bf0c2c',
    desc: '热情和欲望可以突破一切难关。',
    group: 'UI',
    date: '2024-01-08',
  },
  {
    id: 5,
    title: 'React',
    icon: 'bx:bxl-react',
    color: '#00d8ff',
    desc: '健康的身体是实目标的基石。',
    group: '技术牛',
    date: '2024-01-10',
  },
  {
    id: 6,
    title: 'Js',
    icon: 'ion:logo-javascript',
    color: '#4daf1bc9',
    desc: '路是走出来的，而不是空想出来的。',
    group: '架构组',
    date: '2024-01-12',
  },
];

export default [
  {
    url: '/jeecgboot/dashboard/devworkbench/dynamic/list',
    method: 'get',
    response: ({ query }) => {
      const pageSize = Number(query?.pageSize || 10);
      return resultSuccess(dynamicList.slice(0, pageSize));
    },
  },
  {
    url: '/jeecgboot/dashboard/devworkbench/project/list',
    method: 'get',
    response: ({ query }) => {
      const pageSize = Number(query?.pageSize || 6);
      return resultSuccess(projectList.slice(0, pageSize));
    },
  },
] as MockMethod[];