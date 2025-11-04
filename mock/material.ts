import { MockMethod } from 'vite-plugin-mock';
import { resultPageSuccess, resultSuccess } from './_util';

/**
 * 组件管理模拟数据
 */
const componentList = [
  {
    id: '1',
    name: 'BasicTable',
    type: 'display',
    version: '1.0.0',
    path: 'src/components/BasicTable/index.vue',
    code: `<template>
  <div class="basic-table">
    <a-table 
      :columns="columns" 
      :dataSource="dataSource"
      :pagination="pagination"
      @change="handleTableChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  columns: Array,
  dataSource: Array,
  pagination: Object
});

const emit = defineEmits(['change']);

const handleTableChange = (pagination, filters, sorter) => {
  emit('change', pagination, filters, sorter);
};
</script>`,
    description: '基础表格组件，支持分页、排序、筛选等功能',
    status: '1',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-20 14:20:00',
    createBy: 'admin',
    updateBy: 'admin',
  },
  {
    id: '2',
    name: 'FormBuilder',
    type: 'form',
    version: '2.1.0',
    path: 'src/components/FormBuilder/index.vue',
    code: `<template>
  <div class="form-builder">
    <a-form 
      :model="formData"
      :rules="formRules"
      @finish="handleSubmit"
    >
      <a-form-item
        v-for="field in fields"
        :key="field.name"
        :name="field.name"
        :label="field.label"
      >
        <component 
          :is="field.component"
          v-model:value="formData[field.name]"
          v-bind="field.props"
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">提交</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
  fields: Array,
  initialData: Object
});

const emit = defineEmits(['submit']);

const formData = reactive(props.initialData || {});
const formRules = ref({});

const handleSubmit = (values) => {
  emit('submit', values);
};
</script>`,
    description: '动态表单构建器，支持多种表单控件和验证规则',
    status: '1',
    createTime: '2024-01-12 09:15:00',
    updateTime: '2024-01-25 16:45:00',
    createBy: 'developer1',
    updateBy: 'developer1',
  },
  {
    id: '3',
    name: 'ChartWidget',
    type: 'display',
    version: '1.5.0',
    path: 'src/components/ChartWidget/index.vue',
    code: `<template>
  <div class="chart-widget">
    <div ref="chartRef" :style="{ width: '100%', height: height + 'px' }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  option: Object,
  height: {
    type: Number,
    default: 400
  }
});

const chartRef = ref();
let chartInstance = null;

onMounted(() => {
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(props.option);
});

watch(() => props.option, (newOption) => {
  if (chartInstance) {
    chartInstance.setOption(newOption);
  }
}, { deep: true });
</script>`,
    description: 'ECharts图表组件封装，支持多种图表类型',
    status: '1',
    createTime: '2024-01-08 11:20:00',
    updateTime: '2024-01-22 13:30:00',
    createBy: 'designer1',
    updateBy: 'designer1',
  },
  {
    id: '4',
    name: 'LayoutGrid',
    type: 'layout',
    version: '1.2.0',
    path: 'src/layouts/LayoutGrid/index.vue',
    code: `<template>
  <div class="layout-grid" :class="gridClass">
    <div 
      v-for="(item, index) in items"
      :key="index"
      class="grid-item"
      :style="getItemStyle(item)"
    >
      <slot :name="item.slot" :item="item">
        {{ item.content }}
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  items: Array,
  columns: {
    type: Number,
    default: 12
  },
  gap: {
    type: Number,
    default: 16
  }
});

const gridClass = computed(() => ({
  'layout-grid': true,
  [\`grid-cols-\${props.columns}\`]: true
}));

const getItemStyle = (item) => ({
  gridColumn: \`span \${item.span || 1}\`,
  gap: \`\${props.gap}px\`
});
</script>

<style scoped>
.layout-grid {
  display: grid;
  gap: var(--grid-gap, 16px);
}
</style>`,
    description: '响应式网格布局组件，支持自定义列数和间距',
    status: '1',
    createTime: '2024-01-05 15:45:00',
    updateTime: '2024-01-18 10:15:00',
    createBy: 'frontend_dev',
    updateBy: 'frontend_dev',
  },
  {
    id: '5',
    name: 'DataFilter',
    type: 'business',
    version: '1.3.0',
    path: 'src/business/DataFilter/index.vue',
    code: `<template>
  <div class="data-filter">
    <a-card title="数据筛选">
      <a-form layout="inline" @finish="handleFilter">
        <a-form-item
          v-for="filter in filters"
          :key="filter.field"
          :label="filter.label"
        >
          <component
            :is="getFilterComponent(filter.type)"
            v-model:value="filterValues[filter.field]"
            v-bind="filter.props"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">筛选</a-button>
          <a-button @click="handleReset" style="margin-left: 8px">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
  filters: Array
});

const emit = defineEmits(['filter', 'reset']);

const filterValues = reactive({});

const getFilterComponent = (type) => {
  const componentMap = {
    'input': 'a-input',
    'select': 'a-select',
    'date': 'a-date-picker',
    'range': 'a-range-picker'
  };
  return componentMap[type] || 'a-input';
};

const handleFilter = () => {
  emit('filter', filterValues);
};

const handleReset = () => {
  Object.keys(filterValues).forEach(key => {
    filterValues[key] = undefined;
  });
  emit('reset');
};
</script>`,
    description: '数据筛选组件，支持多种筛选条件和重置功能',
    status: '0',
    createTime: '2023-12-28 08:30:00',
    updateTime: '2024-01-10 17:20:00',
    createBy: 'business_dev',
    updateBy: 'business_dev',
  },
];

/**
 * 模板管理模拟数据
 */
const templateList = [
  {
    id: '1',
    templateCode: 'USER_MANAGEMENT_PAGE',
    name: '用户管理页面',
    type: 'page',
    version: '1.0.0',
    gitUrl: 'https://github.com/company/user-management-template.git',
    content: `<template>
  <div class="user-management">
    <div class="page-header">
      <h1>用户管理</h1>
      <a-button type="primary" @click="handleAdd">新增用户</a-button>
    </div>
    
    <div class="search-form">
      <a-form layout="inline" @finish="handleSearch">
        <a-form-item label="用户名">
          <a-input v-model:value="searchForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态">
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </div>
    
    <a-table 
      :columns="columns" 
      :dataSource="dataSource"
      :pagination="pagination"
      @change="handleTableChange"
    >
      <template #action="{ record }">
        <a-button type="link" @click="handleEdit(record)">编辑</a-button>
        <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
      </template>
    </a-table>
    
    <UserModal 
      v-model:visible="modalVisible"
      :record="currentRecord"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import UserModal from './UserModal.vue';

// 响应式数据
const searchForm = reactive({
  username: '',
  status: undefined
});

const dataSource = ref([]);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
});

const modalVisible = ref(false);
const currentRecord = ref(null);

// 表格列配置
const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'realname', key: 'realname' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
];

// 方法定义
const handleAdd = () => {
  currentRecord.value = null;
  modalVisible.value = true;
};

const handleEdit = (record) => {
  currentRecord.value = record;
  modalVisible.value = true;
};

const handleDelete = (record) => {
  // 删除逻辑
};

const handleSearch = () => {
  // 搜索逻辑
};

const handleReset = () => {
  Object.assign(searchForm, {
    username: '',
    status: undefined
  });
};

const handleTableChange = (pag) => {
  pagination.value = pag;
  // 重新加载数据
};

const handleSuccess = () => {
  modalVisible.value = false;
  // 重新加载数据
};

onMounted(() => {
  // 初始化数据
});
</script>`,
    description: '标准的用户管理页面模板，包含搜索、表格、新增编辑等功能',
    status: '1',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-20 14:20:00',
    createBy: 'template_designer',
    updateBy: 'template_designer',
  },
  {
    id: '2',
    templateCode: 'DASHBOARD_PAGE',
    name: '数据看板模板',
    type: 'page',
    version: '2.0.0',
    gitUrl: 'https://github.com/company/dashboard-template.git',
    content: `<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>数据看板</h1>
      <a-range-picker v-model:value="dateRange" @change="handleDateChange" />
    </div>
    
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6" v-for="stat in stats" :key="stat.key">
        <a-card>
          <a-statistic
            :title="stat.title"
            :value="stat.value"
            :suffix="stat.suffix"
            :value-style="{ color: stat.color }"
          />
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" class="charts-row">
      <a-col :span="12">
        <a-card title="趋势图">
          <ChartWidget :option="lineChartOption" :height="300" />
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="分布图">
          <ChartWidget :option="pieChartOption" :height="300" />
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" class="table-row">
      <a-col :span="24">
        <a-card title="详细数据">
          <a-table 
            :columns="tableColumns" 
            :dataSource="tableData"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import ChartWidget from '@/components/ChartWidget.vue';

const dateRange = ref([]);
const stats = ref([
  { key: 'total', title: '总数', value: 1234, suffix: '', color: '#3f8600' },
  { key: 'today', title: '今日', value: 56, suffix: '', color: '#1890ff' },
  { key: 'growth', title: '增长率', value: 12.5, suffix: '%', color: '#cf1322' },
  { key: 'active', title: '活跃', value: 89, suffix: '%', color: '#722ed1' }
]);

const lineChartOption = computed(() => ({
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  yAxis: { type: 'value' },
  series: [{ data: [120, 200, 150, 80, 70, 110, 130], type: 'line' }]
}));

const pieChartOption = computed(() => ({
  series: [{
    type: 'pie',
    data: [
      { value: 335, name: '类型A' },
      { value: 310, name: '类型B' },
      { value: 234, name: '类型C' },
      { value: 135, name: '类型D' }
    ]
  }]
}));

const tableColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '数值', dataIndex: 'value', key: 'value' },
  { title: '状态', dataIndex: 'status', key: 'status' }
];

const tableData = ref([]);

const handleDateChange = (dates) => {
  // 处理日期变化
};

onMounted(() => {
  // 初始化数据
});
</script>`,
    description: '数据看板页面模板，包含统计卡片、图表和数据表格',
    status: '1',
    createTime: '2024-01-12 09:15:00',
    updateTime: '2024-01-25 16:45:00',
    createBy: 'dashboard_designer',
    updateBy: 'dashboard_designer',
  },
  {
    id: '3',
    templateCode: 'FORM_PAGE',
    name: '表单页面模板',
    type: 'page',
    version: '1.1.0',
    gitUrl: 'https://github.com/company/form-page-template.git',
    content: `<template>
  <div class="form-page">
    <a-card title="表单页面">
      <a-form
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
        @finish="handleSubmit"
      >
        <a-form-item label="标题" name="title">
          <a-input v-model:value="formData.title" placeholder="请输入标题" />
        </a-form-item>
        
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="4" placeholder="请输入描述" />
        </a-form-item>
        
        <a-form-item label="类型" name="type">
          <a-select v-model:value="formData.type" placeholder="请选择类型">
            <a-select-option value="type1">类型1</a-select-option>
            <a-select-option value="type2">类型2</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="日期" name="date">
          <a-date-picker v-model:value="formData.date" style="width: 100%" />
        </a-form-item>
        
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="1">启用</a-radio>
            <a-radio value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item :wrapper-col="{ offset: 4, span: 20 }">
          <a-button type="primary" html-type="submit" :loading="loading">提交</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';

const loading = ref(false);

const formData = reactive({
  title: '',
  description: '',
  type: undefined,
  date: undefined,
  status: '1'
});

const formRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }]
};

const handleSubmit = async (values) => {
  loading.value = true;
  try {
    // 提交逻辑
    console.log('提交数据:', values);
    message.success('提交成功');
  } catch (error) {
    message.error('提交失败');
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  Object.assign(formData, {
    title: '',
    description: '',
    type: undefined,
    date: undefined,
    status: '1'
  });
};
</script>`,
    description: '通用表单页面模板，包含各种表单控件和验证',
    status: '1',
    createTime: '2024-01-08 11:20:00',
    updateTime: '2024-01-22 13:30:00',
    createBy: 'form_designer',
    updateBy: 'form_designer',
  },
  {
    id: '4',
    templateCode: 'CARD_LAYOUT_PAGE',
    name: '卡片布局模板',
    type: 'layout',
    version: '1.0.0',
    gitUrl: 'https://github.com/company/card-layout-template.git',
    content: `<template>
  <div class="card-layout">
    <a-row :gutter="[16, 16]">
      <a-col 
        v-for="(card, index) in cards"
        :key="index"
        :xs="24" 
        :sm="12" 
        :md="8" 
        :lg="6"
      >
        <a-card 
          :title="card.title"
          :hoverable="true"
          @click="handleCardClick(card)"
        >
          <template #extra>
            <a-dropdown>
              <a-button type="text" size="small">
                <MoreOutlined />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleEdit(card)">编辑</a-menu-item>
                  <a-menu-item @click="handleDelete(card)">删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
          
          <div class="card-content">
            <div class="card-icon">
              <component :is="card.icon" :style="{ fontSize: '24px', color: card.color }" />
            </div>
            <div class="card-info">
              <p class="card-description">{{ card.description }}</p>
              <div class="card-stats">
                <span class="stat-item">
                  <span class="stat-label">数量:</span>
                  <span class="stat-value">{{ card.count }}</span>
                </span>
                <span class="stat-item">
                  <span class="stat-label">状态:</span>
                  <a-tag :color="card.status === 'active' ? 'green' : 'red'">
                    {{ card.status === 'active' ? '活跃' : '停用' }}
                  </a-tag>
                </span>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { MoreOutlined } from '@ant-design/icons-vue';

const cards = ref([
  {
    id: 1,
    title: '应用管理',
    description: '管理系统中的所有应用',
    icon: 'AppstoreOutlined',
    color: '#1890ff',
    count: 12,
    status: 'active'
  },
  {
    id: 2,
    title: '用户管理',
    description: '管理系统用户和权限',
    icon: 'UserOutlined',
    color: '#52c41a',
    count: 156,
    status: 'active'
  },
  {
    id: 3,
    title: '数据统计',
    description: '查看系统数据统计',
    icon: 'BarChartOutlined',
    color: '#faad14',
    count: 89,
    status: 'active'
  },
  {
    id: 4,
    title: '系统设置',
    description: '配置系统参数',
    icon: 'SettingOutlined',
    color: '#722ed1',
    count: 5,
    status: 'inactive'
  }
]);

const handleCardClick = (card) => {
  console.log('点击卡片:', card);
};

const handleEdit = (card) => {
  console.log('编辑卡片:', card);
};

const handleDelete = (card) => {
  console.log('删除卡片:', card);
};
</script>

<style scoped>
.card-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  flex-shrink: 0;
}

.card-info {
  flex: 1;
}

.card-description {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.card-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.stat-label {
  color: #999;
}

.stat-value {
  font-weight: 500;
}
</style>`,
    description: '响应式卡片布局模板，适用于展示各种功能模块',
    status: '1',
    createTime: '2024-01-05 15:45:00',
    updateTime: '2024-01-18 10:15:00',
    createBy: 'layout_designer',
    updateBy: 'layout_designer',
  },
];

export default [
  // 组件管理接口
  // 获取组件列表
  {
    url: '/jeecgboot/material/component/list',
    method: 'get',
    response: ({ query }) => {
      const { pageNo = 1, pageSize = 10, name, type, status, componentName, componentType } = query;
      let filteredList = [...componentList];

      // 根据组件名称过滤
      const searchName = componentName || name;
      if (searchName) {
        filteredList = filteredList.filter(item =>
          item.name.toLowerCase().includes(String(searchName).toLowerCase())
        );
      }

      // 根据组件类型过滤
      const searchType = componentType || type;
      if (searchType) {
        filteredList = filteredList.filter(item => item.type === searchType);
      }

      // 根据状态过滤
      if (status) {
        filteredList = filteredList.filter(item => item.status === status);
      }

      // 将数据映射为前端所需字段
      const mappedList = filteredList.map((item) => ({
        id: item.id,
        componentName: item.name,
        componentType: item.type,
        version: item.version,
        description: item.description,
        status: item.status,
        // 新增：组件路径
        componentPath: item.path || `src/components/${item.name}/index.vue`,
        // 兼容字段：默认分发方式与技术栈
        distributionType: item.distributionType || 'npm',
        techStack: item.techStack || 'vue3',
        relatedProject: item.relatedProject,
        projectTag: item.projectTag,
        createTime: item.createTime,
        updateTime: item.updateTime,
      }));

      return resultPageSuccess(pageNo, pageSize, mappedList);
    },
  },

  // 导出组件数据
  {
    url: '/jeecgboot/material/component/exportXls',
    method: 'get',
    response: () => {
      return resultSuccess('导出成功');
    },
  },

  // 导入组件数据
  {
    url: '/jeecgboot/material/component/importExcel',
    method: 'post',
    response: () => {
      return resultSuccess('导入成功');
    },
  },

  // 获取组件详情
  {
    url: '/jeecgboot/material/component/queryById',
    method: 'get',
    response: ({ query }) => {
      const { id } = query;
      const component = componentList.find(item => item.id === id);
      if (component) {
        return resultSuccess(component);
      }
      return resultSuccess(null);
    },
  },

  /**
   * 新增组件
   */
  {
    url: '/jeecgboot/material/component/add',
    method: 'post',
    response: ({ body }) => {
      // 将前端传入的字段转换为内部存储结构
      const mapped = {
        id: String(componentList.length + 1),
        name: body.componentName,
        type: body.componentType,
        version: body.version,
        description: body.description,
        status: body.status || '1',
        path: body.componentPath,
        // 额外兼容字段保留在对象上，便于后续扩展
        distributionType: body.distributionType,
        techStack: body.techStack,
        relatedProject: body.relatedProject,
        projectTag: body.projectTag,
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString(),
        createBy: 'admin',
        updateBy: 'admin',
      } as any;
      componentList.push(mapped);
      return resultSuccess('新增成功');
    },
  },

  /**
   * 编辑组件
   */
  {
    url: '/jeecgboot/material/component/edit',
    method: 'put',
    response: ({ body }) => {
      const { id } = body;
      const index = componentList.findIndex(item => item.id === id);
      if (index !== -1) {
        // 映射前端字段到内部存储结构
        const prev = componentList[index];
        const updated = {
          ...prev,
          name: body.componentName ?? prev.name,
          type: body.componentType ?? prev.type,
          version: body.version ?? prev.version,
          description: body.description ?? prev.description,
          status: body.status ?? prev.status,
          path: body.componentPath ?? prev.path,
          distributionType: body.distributionType ?? prev.distributionType,
          techStack: body.techStack ?? prev.techStack,
          relatedProject: body.relatedProject ?? prev.relatedProject,
          projectTag: body.projectTag ?? prev.projectTag,
          updateTime: new Date().toLocaleString(),
          updateBy: 'admin',
        } as any;
        componentList[index] = updated;
      }
      return resultSuccess('编辑成功');
    },
  },

  /**
   * 删除组件
   */
  {
    url: '/jeecgboot/material/component/delete',
    method: 'delete',
    response: ({ query }) => {
      const { id } = query;
      const index = componentList.findIndex(item => item.id === id);
      if (index !== -1) {
        componentList.splice(index, 1);
      }
      return resultSuccess('删除成功');
    },
  },

  /**
   * 批量删除组件
   */
  {
    url: '/jeecgboot/material/component/deleteBatch',
    method: 'delete',
    response: ({ body }) => {
      const { ids } = body;
      ids.forEach(id => {
        const index = componentList.findIndex(item => item.id === id);
        if (index !== -1) {
          componentList.splice(index, 1);
        }
      });
      return resultSuccess('批量删除成功');
    },
  },

  // 导出模板数据
  {
    url: '/jeecgboot/material/template/exportXls',
    method: 'get',
    response: () => {
      return resultSuccess('导出成功');
    },
  },

  // 导入模板数据
  {
    url: '/jeecgboot/material/template/importExcel',
    method: 'post',
    response: () => {
      return resultSuccess('导入成功');
    },
  },

  // 获取模板详情
  {
    url: '/jeecgboot/material/template/queryById',
    method: 'get',
    response: ({ query }) => {
      const { id } = query;
      const template = templateList.find(item => item.id === id);
      if (template) {
        return resultSuccess(template);
      }
      return resultSuccess(null);
    },
  },

  /**
   * 获取模板列表
   */
  {
    url: '/jeecgboot/material/template/list',
    method: 'get',
    response: ({ query }) => {
      const { pageNo = 1, pageSize = 10, name, templateName, type, templateType, status } = query;
      let filteredList = [...templateList];

      // 根据模板名称过滤
      const searchName = templateName ?? name;
      if (searchName) {
        filteredList = filteredList.filter(item => 
          item.name.toLowerCase().includes(String(searchName).toLowerCase())
        );
      }

      // 根据模板类型过滤
      const searchType = templateType ?? type;
      if (searchType) {
        filteredList = filteredList.filter(item => item.type === searchType);
      }

      // 根据状态过滤
      if (status) {
        filteredList = filteredList.filter(item => item.status === status);
      }

      // 字段映射以适配前端columns显示
      const mappedList = filteredList.map(item => ({
        id: item.id,
        templateName: item.name,
        templateCode: item.templateCode,
        templateType: item.type,
        version: item.version,
        description: item.description,
        status: item.status,
        createTime: item.createTime,
        gitUrl: item.gitUrl,
        // 保留原始字段以兼容其他使用场景
        name: item.name,
        type: item.type,
        content: item.content,
      }));

      // 分页处理
      const start = (pageNo - 1) * pageSize;
      const end = start + pageSize;
      const records = mappedList.slice(start, end);

      return resultPageSuccess(pageNo, pageSize, mappedList);
    },
  },

  /**
   * 新增模板
   */
  {
    url: '/jeecgboot/material/template/add',
    method: 'post',
    response: ({ body }) => {
      const newTemplate = {
        id: String(templateList.length + 1),
        templateCode: body.templateCode,
        name: body.templateName,
        type: body.templateType,
        version: body.version,
        gitUrl: body.gitUrl,
        content: body.sourceCode,
        description: body.description,
        status: body.status ?? '1',
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString(),
        createBy: 'admin',
        updateBy: 'admin',
      };
      templateList.push(newTemplate);
      return resultSuccess('新增成功');
    },
  },

  /**
   * 编辑模板
   */
  {
    url: '/jeecgboot/material/template/edit',
    method: 'put',
    response: ({ body }) => {
      const { id } = body;
      const index = templateList.findIndex(item => item.id === id);
      if (index !== -1) {
        const old = templateList[index];
        templateList[index] = {
          ...old,
          templateCode: body.templateCode ?? old.templateCode,
          name: body.templateName ?? old.name,
          type: body.templateType ?? old.type,
          version: body.version ?? old.version,
          gitUrl: body.gitUrl ?? old.gitUrl,
          // 编辑不强制更新内容，若传递则更新
          content: body.sourceCode ?? old.content,
          description: body.description ?? old.description,
          status: body.status ?? old.status,
          updateTime: new Date().toLocaleString(),
          updateBy: 'admin',
        };
      }
      return resultSuccess('编辑成功');
    },
  },

  /**
   * 删除模板
   */
  {
    url: '/jeecgboot/material/template/delete',
    method: 'delete',
    response: ({ query }) => {
      const { id } = query;
      const index = templateList.findIndex(item => item.id === id);
      if (index !== -1) {
        templateList.splice(index, 1);
      }
      return resultSuccess('删除成功');
    },
  },

  /**
   * 批量删除模板
   */
  {
    url: '/jeecgboot/material/template/deleteBatch',
    method: 'delete',
    response: ({ body }) => {
      const { ids } = body;
      ids.forEach(id => {
        const index = templateList.findIndex(item => item.id === id);
        if (index !== -1) {
          templateList.splice(index, 1);
        }
      });
      return resultSuccess('批量删除成功');
    },
  },
] as MockMethod[];