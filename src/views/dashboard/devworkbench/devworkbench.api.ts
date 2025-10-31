import { defHttp } from '/@/utils/http/axios';

// 接口枚举，按模块划分
enum DevWorkbenchApi {
  // 最新动态列表
  getDynamicList = '/dashboard/devworkbench/dynamic/list',
  // 项目列表
  getProjectList = '/dashboard/devworkbench/project/list',
}

// 类型定义
export interface DynamicInfoItem {
  id?: string | number;
  avatar: string;
  name: string;
  date: string;
  desc: string;
}

export interface GroupItem {
  id?: string | number;
  title: string;
  icon: string;
  color: string;
  desc: string;
  date: string;
  group: string;
}

// 获取最新动态列表
export const getDynamicInfoList = (params?: Record<string, any>) => {
  return defHttp.get<DynamicInfoItem[]>({ url: DevWorkbenchApi.getDynamicList, params });
};

// 获取项目列表
export const getProjectList = (params?: Record<string, any>) => {
  return defHttp.get<GroupItem[]>({ url: DevWorkbenchApi.getProjectList, params });
};