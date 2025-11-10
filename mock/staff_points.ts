import { MockMethod } from 'vite-plugin-mock';
import { resultPageSuccess, resultSuccess } from './_util';

// ���ﵥ���ṩ /verto-backend ǰ׺����Ա�������� Mock �ӿڣ�
// �Ա�ǰ��ʹ�õ� API��/verto-backend/...������ֱ������ Mock��

type StaffItem = {
  id: string;
  name: string;
  employeeNo: string;
  email: string;
  phone: string;
  hireDate: string;
  workLocation: string;
  skills: string[];
  status: number;
  remark?: string;
  createTime: string;
  updateTime?: string;
  createBy: string;
  updateBy?: string;
  // �б�չʾʹ��
  points?: number;
};

// ȡ mock/staff.ts ��ǰ������Աʾ�����㹻����ҳ��չʾ��������ʾ
const staffList: StaffItem[] = [
  {
    id: '1',
    name: '张三',
    employeeNo: 'EMP001',
    email: 'zhangsan@company.com',
    phone: '13800138001',
    hireDate: '2023-01-15',
    workLocation: 'A座3楼301工位',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Vue.js'],
    status: 1,
    remark: '资深后端开发工程师，负责核心业务系统开发',
    createTime: '2023-01-15 09:00:00',
    updateTime: '2024-01-20 14:30:00',
    createBy: 'admin',
    updateBy: 'hr_manager',
  },
  {
    id: '2',
    name: '李四',
    employeeNo: 'EMP002',
    email: 'lisi@company.com',
    phone: '13800138002',
    hireDate: '2023-02-20',
    workLocation: 'A座3楼302工位',
    skills: ['JavaScript', 'Vue.js', 'React', 'Node.js', 'UI设计'],
    status: 1,
    remark: '前端开发工程师，擅长现代前端框架和用户体验设计',
    createTime: '2023-02-20 10:15:00',
    updateTime: '2024-01-18 16:45:00',
    createBy: 'admin',
    updateBy: 'hr_manager',
  },
  {
    id: '3',
    name: '王五',
    employeeNo: 'EMP003',
    email: 'wangwu@company.com',
    phone: '13800138003',
    hireDate: '2023-03-10',
    workLocation: 'B座2楼201工位',
    skills: ['Python', 'Django', 'PostgreSQL', '数据分析', 'Docker'],
    status: 1,
    remark: 'Python开发工程师，专注于数据处理和分析系统',
    createTime: '2023-03-10 14:20:00',
    updateTime: '2024-01-15 11:30:00',
    createBy: 'admin',
    updateBy: 'tech_lead',
  },
  {
    id: '4',
    name: '赵六',
    employeeNo: 'EMP004',
    email: 'zhaoliu@company.com',
    phone: '13800138004',
    hireDate: '2023-04-05',
    workLocation: 'A座4楼401工位',
    skills: ['项目管理', 'Scrum', 'Jira', '需求分析'],
    status: 1,
    remark: '项目经理，负责多个重要项目的规划和执行',
    createTime: '2023-04-05 08:45:00',
    updateTime: '2024-01-22 09:15:00',
    createBy: 'admin',
    updateBy: 'pm_director',
  },
  {
    id: '5',
    name: '孙七',
    employeeNo: 'EMP005',
    email: 'sunqi@company.com',
    phone: '13800138005',
    hireDate: '2023-05-12',
    workLocation: 'B座3楼305工位',
    skills: ['UI设计', '产品设计', 'Figma', 'Sketch', 'Photoshop'],
    status: 1,
    remark: 'UI/UX设计师，负责产品界面设计和用户体验优化',
    createTime: '2023-05-12 13:30:00',
    updateTime: '2024-01-19 15:20:00',
    createBy: 'admin',
    updateBy: 'design_lead',
  },
  {
    id: '6',
    name: '周八',
    employeeNo: 'EMP006',
    email: 'zhouba@company.com',
    phone: '13800138006',
    hireDate: '2023-06-18',
    workLocation: 'A座2楼205工位',
    skills: ['测试', 'Selenium', 'JMeter', '自动化测试', 'Bug管理'],
    status: 1,
    remark: '测试工程师，负责系统功能测试和自动化测试框架搭建',
    createTime: '2023-06-18 10:00:00',
    updateTime: '2024-01-16 12:40:00',
    createBy: 'admin',
    updateBy: 'qa_manager',
  },
];

// ������־���Ͷ���
type PointsLog = {
  id: string;
  staffId: string;
  eventType: string; // �¼����ͣ�չʾ�����ģ�
  sourceType: 'APP' | 'PROJECT' | 'COMPONENT' | 'OTHER';
  sourceId?: string;
  sourceName: string;
  delta: number; // ���ֱ䶯��֧�ָ���
  remark?: string;
  createTime: string;
};

// Ϊ������Ա׼��������־ʾ�����ݣ�������ԱĬ��0�֡�����ˮ��
const pointsLogsByStaffId: Record<string, PointsLog[]> = {
  '1': [
    {
      id: 'log-1-001',
      staffId: '1',
      eventType: '应用维护默认加分',
      sourceType: 'APP',
      sourceId: 'app-uc',
      sourceName: '用户中心',
      delta: 1,
      remark: '作为应用维护默认+1',
      createTime: '2024-02-01 09:00:00',
    },
    {
      id: 'log-1-002',
      staffId: '1',
      eventType: '项目贡献',
      sourceType: 'PROJECT',
      sourceId: 'prj-pay-refactor',
      sourceName: '支付系统重构',
      delta: 1,
      remark: '参与项目贡献，团队成员+1',
      createTime: '2024-02-15 10:30:00',
    },
    {
      id: 'log-1-003',
      staffId: '1',
      eventType: '组件维护默认加分',
      sourceType: 'COMPONENT',
      sourceId: 'cmp-login',
      sourceName: '登录组件',
      delta: 1,
      remark: '作为组件维护默认+1',
      createTime: '2024-03-01 08:20:00',
    },
    {
      id: 'log-1-004',
      staffId: '1',
      eventType: '组件使用加分',
      sourceType: 'COMPONENT',
      sourceId: 'cmp-login',
      sourceName: '登录组件',
      delta: 1,
      remark: '被项目A使用，维护加+1',
      createTime: '2024-03-04 14:05:00',
    },
    {
      id: 'log-1-005',
      staffId: '1',
      eventType: '组件使用加分',
      sourceType: 'COMPONENT',
      sourceId: 'cmp-login',
      sourceName: '登录组件',
      delta: 1,
      remark: '被项目B使用，维护加+1',
      createTime: '2024-03-10 11:22:00',
    },
  ],
  '2': [
    {
      id: 'log-2-001',
      staffId: '2',
      eventType: '项目贡献',
      sourceType: 'PROJECT',
      sourceId: 'prj-fe-portal',
      sourceName: '优化前端重构',
      delta: 1,
      remark: '参与项目贡献，团队成员+1',
      createTime: '2024-02-12 13:10:00',
    },
    {
      id: 'log-2-002',
      staffId: '2',
      eventType: '组件维护默认加分',
      sourceType: 'COMPONENT',
      sourceId: 'cmp-table',
      sourceName: '高级表格组件',
      delta: 1,
      remark: '作为组件维护默认+1',
      createTime: '2024-03-02 09:05:00',
    },
    {
      id: 'log-2-003',
      staffId: '2',
      eventType: '组件使用加分',
      sourceType: 'COMPONENT',
      sourceId: 'cmp-table',
      sourceName: '高级表格组件',
      delta: 1,
      remark: '在优化项目中使用，维护加+1',
      createTime: '2024-03-12 19:40:00',
    },
  ],
  '3': [
    {
      id: 'log-3-001',
      staffId: '3',
      eventType: '应用维护默认加分',
      sourceType: 'APP',
      sourceId: 'app-analytics',
      sourceName: '数据分析平台',
      delta: 1,
      remark: '作为应用维护默认+1',
      createTime: '2024-01-28 16:00:00',
    },
    {
      id: 'log-3-002',
      staffId: '3',
      eventType: '项目贡献',
      sourceType: 'PROJECT',
      sourceId: 'prj-data-etl',
      sourceName: '数据ETL管道',
      delta: 1,
      remark: '参与项目贡献，团队成员+1',
      createTime: '2024-02-20 10:00:00',
    },
  ],
  '6': [
    {
      id: 'log-6-001',
      staffId: '6',
      eventType: '项目贡献',
      sourceType: 'PROJECT',
      sourceId: 'prj-qa-automation',
      sourceName: '自动化测试平台',
      delta: 1,
      remark: '参与项目贡献，团队成员+1',
      createTime: '2024-02-18 09:45:00',
    },
  ],
};

function getPointsLogs(staffId: string): PointsLog[] {
  return pointsLogsByStaffId[staffId] ? [...pointsLogsByStaffId[staffId]] : [];
}

function getTotalPoints(staffId: string): number {
  return getPointsLogs(staffId).reduce((sum, log) => sum + Number(log.delta || 0), 0);
}

export default [
  // 人员列表（含积分）
  {
    url: '/verto/staff/list',
    method: 'get',
    response: ({ query }) => {
      const { pageNo = 1, pageSize = 10, name, employeeNo, email, status } = query;
      let filteredList = [...staffList];

      if (name) {
        filteredList = filteredList.filter(item => item.name.toLowerCase().includes(String(name).toLowerCase()));
      }
      if (employeeNo) {
        filteredList = filteredList.filter(item => item.employeeNo.toLowerCase().includes(String(employeeNo).toLowerCase()));
      }
      if (email) {
        filteredList = filteredList.filter(item => item.email.toLowerCase().includes(String(email).toLowerCase()));
      }
      if (status !== undefined && status !== '') {
        filteredList = filteredList.filter(item => item.status === Number(status));
      }

      const listWithPoints = filteredList.map((item) => ({
        ...item,
        points: getTotalPoints(item.id),
      }));

      return resultPageSuccess(Number(pageNo), Number(pageSize), listWithPoints);
    },
  },

  // 人员详情
  {
    url: '/verto/staff/queryById',
    method: 'get',
    response: ({ query }) => {
      const { id } = query;
      const staff = staffList.find(item => item.id === String(id));
      return resultSuccess(staff);
    },
  },

  // 积分汇总
  {
    url: '/verto/staff/points/summary',
    method: 'get',
    response: ({ query }) => {
      const { staffId } = query;
      const totalPoints = getTotalPoints(String(staffId));
      return resultSuccess({ totalPoints });
    },
  },

  // 积分流水分页
  {
    url: '/verto/staff/points/logs',
    method: 'get',
    response: ({ query }) => {
      const { staffId, pageNo = 1, pageSize = 10, eventType, sourceType } = query;
      let logs = getPointsLogs(String(staffId));

      // �¼����͹���
      if (eventType) {
        logs = logs.filter((l) => String(l.eventType) === String(eventType));
      }
      // ��Դ���͹���
      if (sourceType) {
        logs = logs.filter((l) => String(l.sourceType) === String(sourceType));
      }

      // ʱ�䵹��
      logs.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));

      return resultPageSuccess(Number(pageNo), Number(pageSize), logs);
    },
  },

  // 全员积分流水分页（支持 staffId、eventType、sourceType、keyword）
  {
    url: '/verto/staff/points/logs/all',
    method: 'get',
    response: ({ query }) => {
      const { staffId, pageNo = 1, pageSize = 10, eventType, sourceType, keyword } = query;

      // ��ϲ�����Ա�Ļ���ˮ
      let allLogs: (PointsLog & { staffName?: string })[] = Object.keys(pointsLogsByStaffId).flatMap((sid) => {
        const logs = pointsLogsByStaffId[sid] || [];
        const staffName = (staffList.find((s) => s.id === sid) || { name: sid as any }).name as string;
        return logs.map((l) => ({ ...l, staffName }));
      });

      // ����Ա 筛选
      if (staffId) {
        const idStr = String(staffId);
        allLogs = allLogs.filter((l) => String(l.staffId) === idStr);
      }

      // �¼����͹���
      if (eventType) {
        const et = String(eventType);
        allLogs = allLogs.filter((l) => String(l.eventType) === et);
      }

      // ��Դ���͹���
      if (sourceType) {
        const st = String(sourceType);
        allLogs = allLogs.filter((l) => String(l.sourceType) === st);
      }

      // �ؼ�������（��Դ�������¼����ͣ��͡���ע����ƥ��）
      if (keyword) {
        const kw = String(keyword).toLowerCase();
        allLogs = allLogs.filter((l) =>
          String(l.sourceName || '').toLowerCase().includes(kw) ||
          String(l.eventType || '').toLowerCase().includes(kw) ||
          String(l.remark || '').toLowerCase().includes(kw) ||
          String(l.staffName || '').toLowerCase().includes(kw)
        );
      }

      // ʱ�䵹��
      allLogs.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));

      return resultPageSuccess(Number(pageNo), Number(pageSize), allLogs);
    },
  },

  // 手动调整积分（加/减分）
  {
    url: '/verto/staff/points/adjust',
    method: 'post',
    response: ({ body }) => {
      const { staffId, delta = 0, remark = '手动调整', sourceType = 'OTHER', eventType = '手动调整', sourceId, sourceName } = body || {};
      const id = String(staffId);
      const newLog: PointsLog = {
        id: `log-${id}-${Date.now()}`,
        staffId: id,
        eventType: String(eventType),
        sourceType: String(sourceType).toUpperCase() as any,
        sourceId,
        sourceName: sourceName || '手动调整',
        delta: Number(delta),
        remark,
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      pointsLogsByStaffId[id] = pointsLogsByStaffId[id] || [];
      pointsLogsByStaffId[id].push(newLog);
      return resultSuccess({ success: true });
    },
  },
  // 兼容不同的 URL 前缀：/jeecgboot 和 无前缀（开发环境可能配置不同）
  // 注意：人员列表/详情等已由 mock/staff.ts 提供 /jeecgboot 前缀，这里仅补充积分相关接口的别名
  {
    url: '/jeecgboot/staff/points/summary',
    method: 'get',
    response: ({ query }) => {
      const { staffId } = query;
      const totalPoints = getTotalPoints(String(staffId));
      return resultSuccess({ totalPoints });
    },
  },
  {
    url: '/jeecgboot/staff/points/logs',
    method: 'get',
    response: ({ query }) => {
      const { staffId, pageNo = 1, pageSize = 10, eventType, sourceType } = query;
      let logs = getPointsLogs(String(staffId));
      if (eventType) {
        logs = logs.filter((l) => String(l.eventType) === String(eventType));
      }
      if (sourceType) {
        logs = logs.filter((l) => String(l.sourceType) === String(sourceType));
      }
      logs.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
      return resultPageSuccess(Number(pageNo), Number(pageSize), logs);
    },
  },
  {
    url: '/jeecgboot/staff/points/logs/all',
    method: 'get',
    response: ({ query }) => {
      const { staffId, pageNo = 1, pageSize = 10, eventType, sourceType, keyword } = query;
      let allLogs: (PointsLog & { staffName?: string })[] = Object.keys(pointsLogsByStaffId).flatMap((sid) => {
        const logs = pointsLogsByStaffId[sid] || [];
        const staffName = (staffList.find((s) => s.id === sid) || { name: sid as any }).name as string;
        return logs.map((l) => ({ ...l, staffName }));
      });
      if (staffId) {
        const idStr = String(staffId);
        allLogs = allLogs.filter((l) => String(l.staffId) === idStr);
      }
      if (eventType) {
        const et = String(eventType);
        allLogs = allLogs.filter((l) => String(l.eventType) === et);
      }
      if (sourceType) {
        const st = String(sourceType);
        allLogs = allLogs.filter((l) => String(l.sourceType) === st);
      }
      if (keyword) {
        const kw = String(keyword).toLowerCase();
        allLogs = allLogs.filter((l) =>
          String(l.sourceName || '').toLowerCase().includes(kw) ||
          String(l.eventType || '').toLowerCase().includes(kw) ||
          String(l.remark || '').toLowerCase().includes(kw) ||
          String(l.staffName || '').toLowerCase().includes(kw)
        );
      }
      allLogs.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
      return resultPageSuccess(Number(pageNo), Number(pageSize), allLogs);
    },
  },
  {
    url: '/jeecgboot/staff/points/adjust',
    method: 'post',
    response: ({ body }) => {
      const { staffId, delta = 0, remark = '手动调整', sourceType = 'OTHER', eventType = '手动调整', sourceId, sourceName } = body || {};
      const id = String(staffId);
      const newLog: PointsLog = {
        id: `log-${id}-${Date.now()}`,
        staffId: id,
        eventType: String(eventType),
        sourceType: String(sourceType).toUpperCase() as any,
        sourceId,
        sourceName: sourceName || '手动调整',
        delta: Number(delta),
        remark,
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      pointsLogsByStaffId[id] = pointsLogsByStaffId[id] || [];
      pointsLogsByStaffId[id].push(newLog);
      return resultSuccess({ success: true });
    },
  },
  // 无前缀别名（当 VITE_GLOB_API_URL_PREFIX 为空时）
  {
    url: '/staff/points/summary',
    method: 'get',
    response: ({ query }) => {
      const { staffId } = query;
      const totalPoints = getTotalPoints(String(staffId));
      return resultSuccess({ totalPoints });
    },
  },
  {
    url: '/staff/points/logs',
    method: 'get',
    response: ({ query }) => {
      const { staffId, pageNo = 1, pageSize = 10, eventType, sourceType } = query;
      let logs = getPointsLogs(String(staffId));
      if (eventType) {
        logs = logs.filter((l) => String(l.eventType) === String(eventType));
      }
      if (sourceType) {
        logs = logs.filter((l) => String(l.sourceType) === String(sourceType));
      }
      logs.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
      return resultPageSuccess(Number(pageNo), Number(pageSize), logs);
    },
  },
  {
    url: '/staff/points/logs/all',
    method: 'get',
    response: ({ query }) => {
      const { staffId, pageNo = 1, pageSize = 10, eventType, sourceType, keyword } = query;
      let allLogs: (PointsLog & { staffName?: string })[] = Object.keys(pointsLogsByStaffId).flatMap((sid) => {
        const logs = pointsLogsByStaffId[sid] || [];
        const staffName = (staffList.find((s) => s.id === sid) || { name: sid as any }).name as string;
        return logs.map((l) => ({ ...l, staffName }));
      });
      if (staffId) {
        const idStr = String(staffId);
        allLogs = allLogs.filter((l) => String(l.staffId) === idStr);
      }
      if (eventType) {
        const et = String(eventType);
        allLogs = allLogs.filter((l) => String(l.eventType) === et);
      }
      if (sourceType) {
        const st = String(sourceType);
        allLogs = allLogs.filter((l) => String(l.sourceType) === st);
      }
      if (keyword) {
        const kw = String(keyword).toLowerCase();
        allLogs = allLogs.filter((l) =>
          String(l.sourceName || '').toLowerCase().includes(kw) ||
          String(l.eventType || '').toLowerCase().includes(kw) ||
          String(l.remark || '').toLowerCase().includes(kw) ||
          String(l.staffName || '').toLowerCase().includes(kw)
        );
      }
      allLogs.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
      return resultPageSuccess(Number(pageNo), Number(pageSize), allLogs);
    },
  },
  {
    url: '/staff/points/adjust',
    method: 'post',
    response: ({ body }) => {
      const { staffId, delta = 0, remark = '手动调整', sourceType = 'OTHER', eventType = '手动调整', sourceId, sourceName } = body || {};
      const id = String(staffId);
      const newLog: PointsLog = {
        id: `log-${id}-${Date.now()}`,
        staffId: id,
        eventType: String(eventType),
        sourceType: String(sourceType).toUpperCase() as any,
        sourceId,
        sourceName: sourceName || '手动调整',
        delta: Number(delta),
        remark,
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      pointsLogsByStaffId[id] = pointsLogsByStaffId[id] || [];
      pointsLogsByStaffId[id].push(newLog);
      return resultSuccess({ success: true });
    },
  },
] as MockMethod[];
