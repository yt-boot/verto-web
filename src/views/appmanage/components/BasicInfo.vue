<template>
  <div class="app-basic-info">
    <a-card title="应用信息" :bordered="false">
      <template #extra>
        <a-button type="primary" size="small" @click="startEditExtraInfo">编辑详细信息</a-button>
      </template>
      
      <a-descriptions :column="2" bordered class="info-descriptions">
        <a-descriptions-item label="应用简称">
          {{ appInfo.appName || '暂无数据' }}
        </a-descriptions-item>
        <a-descriptions-item label="所属领域">
          {{ getDomainText(appInfo.domain) }}
        </a-descriptions-item>
        <a-descriptions-item label="Git地址">
          <template v-if="appInfo.gitUrl">
            <a :href="appInfo.gitUrl" target="_blank">{{ appInfo.gitUrl }}</a>
          </template>
          <template v-else>
            暂无数据
          </template>
        </a-descriptions-item>
        <a-descriptions-item label="创建人">
          {{ getPersonName(appInfo.createBy) || '暂无数据' }}
        </a-descriptions-item>
        <a-descriptions-item label="应用负责人">
          {{ getPersonsName(appInfo.managers) || '暂无数据' }}
        </a-descriptions-item>
        <a-descriptions-item label="应用等级">
          {{ getAppLevelText(appInfo.appLevel) || '其他' }}
        </a-descriptions-item>
        <a-descriptions-item label="应用描述" :span="2">
          {{ appInfo.appDescription || '暂无数据' }}
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">
          {{ appInfo.createTime || '暂无数据' }}
        </a-descriptions-item>
        <a-descriptions-item label="更新时间">
          {{ appInfo.updateTime || '暂无数据' }}
        </a-descriptions-item>
        <a-descriptions-item label="详细信息" :span="1" v-if="!isEditingExtraInfo">
          {{ appInfo.extra_info || '暂无数据' }}
        </a-descriptions-item>
      </a-descriptions>
      
      <!-- 详细信息字段，使用textarea进行编辑 -->
      <div v-if="isEditingExtraInfo" class="extra-info-section">
        <h3 class="section-title">编辑详细信息</h3>
        <div class="extra-info-content">
          <a-textarea 
            v-model:value="editExtraInfoModel" 
            rows="10" 
            placeholder="请输入详细信息"
            class="extra-info-textarea"
          />
          <div class="editor-actions">
            <a-button type="primary" @click="saveExtraInfo" :loading="saving">保存</a-button>
            <a-button @click="cancelEditExtraInfo">取消</a-button>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import { useMessage } from '/@/hooks/web/useMessage';
import { editApp, getActiveStaffList, getUserList, getDomainDict, getAppLevelDict } from '../AppManage.api';

// Props定义
const props = defineProps<{
  appId: string;
  appDetail: any;
}>();

// Emits定义
const emit = defineEmits(['save']);

// 消息提示
const { createMessage } = useMessage();

// 缓存：领域字典、应用等级字典与人员映射
const domainMapRef = ref<Map<string, string>>(new Map());
const appLevelMapRef = ref<Map<string, string>>(new Map());
const staffIdToNameRef = ref<Map<string, string>>(new Map());
const staffUsernameToNameRef = ref<Map<string, string>>(new Map());
// 系统用户映射
const userIdToNameRef = ref<Map<string, string>>(new Map());
const userUsernameToNameRef = ref<Map<string, string>>(new Map());

// 加载人员映射数据
const loadStaffMaps = async () => {
  try {
    const [staffRes, userRes] = await Promise.all([
      getActiveStaffList({ pageNo: 1, pageSize: 1000 }),
      getUserList({ pageNo: 1, pageSize: 1000 })
    ]);
    
    // 处理staff数据
    const staffRows = staffRes?.records || [];
    const id2name = new Map<string, string>();
    const username2name = new Map<string, string>();
    
    staffRows.forEach((u: any) => {
      if (!u) return;
      const id = u.id != null ? String(u.id) : undefined;
      const username = u.username != null ? String(u.username) : undefined;
      const name = u.name || '';
      if (id) id2name.set(id, name);
      if (username) username2name.set(username, name);
    });
    
    staffIdToNameRef.value = id2name;
    staffUsernameToNameRef.value = username2name;
    
    // 处理user数据
    const userRows = userRes?.result?.records || userRes?.result || [];
    const userId2name = new Map<string, string>();
    const userUsername2name = new Map<string, string>();
    
    userRows.forEach((u: any) => {
      if (!u) return;
      const id = u.id != null ? String(u.id) : undefined;
      const username = u.username != null ? String(u.username) : undefined;
      const name = u.realname || u.name || u.nickname || u.label || u.text || username || id || '';
      if (id) userId2name.set(id, name);
      if (username) userUsername2name.set(username, name);
    });
    
    userIdToNameRef.value = userId2name;
    userUsernameToNameRef.value = userUsername2name;
  } catch (e) {
    console.warn('加载人员映射失败', e);
  }
};

// 获取人员名称
const getPersonName = (key: string): string => {
  const id2name = new Map([...staffIdToNameRef.value, ...userIdToNameRef.value]);
  const username2name = new Map([...staffUsernameToNameRef.value, ...userUsernameToNameRef.value]);
  
  return id2name.get(key) || username2name.get(key) || key || '-';
};

// 获取多人员名称（逗号分隔）
const getPersonsName = (keys: string | string[]): string => {
  if (!keys) return '-';
  
  const idsArr = Array.isArray(keys)
    ? keys
    : String(keys).split(',').map(s => s.trim()).filter(Boolean);
  
  return idsArr.map(key => getPersonName(key)).join(', ') || '-';
};

// 加载领域字典
const loadDomainMap = async () => {
  try {
    const resp = await getDomainDict();
    const items = resp?.result || resp || [];
    const map = new Map<string, string>();
    (items || []).forEach((it: any) => {
      if (it && (it.value != null)) {
        map.set(String(it.value), it.text || it.label || it.title || String(it.value));
      }
    });
    domainMapRef.value = map;
  } catch (e) {
    console.warn('加载领域字典失败', e);
  }
};

// 加载应用等级字典
const loadAppLevelMap = async () => {
  try {
    const resp = await getAppLevelDict();
    const items = resp?.result || resp || [];
    const map = new Map<string, string>();
    (items || []).forEach((it: any) => {
      if (it && (it.value != null)) {
        map.set(String(it.value), it.text || it.label || it.title || String(it.value));
      }
    });
    appLevelMapRef.value = map;
  } catch (e) {
    console.warn('加载应用等级字典失败', e);
  }
};

// 加载所有映射数据
const loadAllMaps = async () => {
  await Promise.all([loadStaffMaps(), loadDomainMap(), loadAppLevelMap()]);
};


// 组件挂载时加载所有映射数据
onMounted(() => {
  loadAllMaps();
});

// 处理extra_info函数 - 移到使用之前定义
const processExtraInfo = (extraInfo: any): string => {
  if (!extraInfo) return '';
  try {
    // 如果是对象，转换为字符串
    if (typeof extraInfo === 'object') {
      return JSON.stringify(extraInfo, null, 2);
    }
    return String(extraInfo);
  } catch (error) {
    console.error('处理extra_info失败:', error);
    return '';
  }
}

// 应用信息状态
const appInfo = ref({
  appName: props.appDetail?.appName || '',
  domain: props.appDetail?.domain || '',
  appLevel: props.appDetail?.appLevel || 'other',
  gitUrl: props.appDetail?.gitUrl || '',
  createBy: props.appDetail?.createBy || '',
  managers: props.appDetail?.managers || '',
  appDescription: props.appDetail?.appDescription || '',
  createTime: props.appDetail?.createTime || '',
  updateTime: props.appDetail?.updateTime || '',
  extra_info: processExtraInfo(props.appDetail?.extra_info)
});

// 编辑状态
const isEditingExtraInfo = ref(false);
const editExtraInfoModel = ref('');
const saving = ref(false);

// 监听appDetail变化，更新appInfo
watch(() => props.appDetail, (newDetail) => {
  if (newDetail) {
    appInfo.value = {
      appName: newDetail.appName || '',
      domain: newDetail.domain || '',
      appLevel: newDetail.appLevel || 'other',
      gitUrl: newDetail.gitUrl || '',
      createBy: newDetail.createBy || '',
      managers: newDetail.managers || '',
      appDescription: newDetail.appDescription || '',
      createTime: newDetail.createTime || '',
      updateTime: newDetail.updateTime || '',
      extra_info: processExtraInfo(newDetail.extra_info)
    };
    
    // 如果当前正在编辑状态，同步更新编辑模型
    if (isEditingExtraInfo.value) {
      editExtraInfoModel.value = appInfo.value.extra_info;
    }
    
    // 重新加载所有映射数据
    loadAllMaps();
  }
}, { deep: true });

// 获取领域文本
function getDomainText(domain?: string): string {
  const domainCode = domain != null ? String(domain) : '';
  return domainMapRef.value.get(domainCode) || domainCode || '未分类';
}

// 获取应用等级文本
function getAppLevelText(appLevel?: string): string {
  const appLevelCode = appLevel != null ? String(appLevel) : '';
  return appLevelMapRef.value.get(appLevelCode) || appLevelCode || '其他';
}

// 开始编辑详细信息
const startEditExtraInfo = () => {
  if (!appInfo.value || (!props.appId && !props.appDetail?.id)) {
    createMessage.error('应用信息不存在或未加载完成');
    return;
  }
  // 确保正确初始化编辑模型
  const currentExtraInfo = appInfo.value.extra_info || '';
  editExtraInfoModel.value = String(currentExtraInfo);
  console.log('编辑模式开始，初始值:', editExtraInfoModel.value);
  isEditingExtraInfo.value = true;
}

// 取消编辑
const cancelEditExtraInfo = () => {
  editExtraInfoModel.value = '';
  isEditingExtraInfo.value = false;
}

// 保存详细信息
const saveExtraInfo = async () => {
  const appId = props.appId || props.appDetail?.id;
  if (!appInfo.value || !appId) {
    createMessage.error('应用信息不存在或未加载完成');
    return;
  }
  
  saving.value = true;
  try {
    // 直接使用editExtraInfoModel的值，v-model已经保证它实时获取用户输入
    const newExtraInfo = editExtraInfoModel.value;
    console.log(newExtraInfo, 'newExtraInfo====');
    
    const submitData = {
      id: appId,
      extra_info: newExtraInfo
    };
    
    // 安全地调用API并检查结果
    const result = await editApp(submitData);
    
    // 增加对result的明确判断
    if (result && result.success) {
      const newDetail = result.result || submitData;
      // 更新本地显示
      appInfo.value.extra_info = newExtraInfo;
      
      // 通知父组件并传递完整的新数据
      const updatedDetail = {
        ...(props.appDetail || {}),
        ...newDetail
      };
      emit('save', updatedDetail);
      
      createMessage.success('保存成功');
      isEditingExtraInfo.value = false;
      editExtraInfoModel.value = '';
    } else {
      // 处理失败情况
      createMessage.error(typeof result === 'object' && result !== null ? result.message || '保存失败' : '保存失败');
    }
  } catch (error) {
    // 全面的错误处理
    console.error('保存详细信息失败:', error);
    if (error && typeof error === 'object' && 'message' in error) {
      createMessage.error(String(error.message));
    } else if (typeof error === 'string') {
      createMessage.error(error);
    } else {
      createMessage.error('保存失败');
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.app-basic-info {
  padding: 20px;
}

.info-descriptions {
  margin-bottom: 30px;
}

.extra-info-section {
  margin-top: 20px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.85);
}

.extra-info-content {
  min-height: 200px;
}

.extra-info-textarea {
  width: 100%;
  min-height: 200px;
}

.no-data {
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.editor-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
}
</style>