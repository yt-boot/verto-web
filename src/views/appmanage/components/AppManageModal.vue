<!--应用管理抽屉（动态表单，无分步）-->
<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    :title="getTitle"
    :width="800"
    destroyOnClose
    @ok="handleSubmit"
    :confirmLoading="confirmLoading"
  >
    <!-- 应用信息表单（动态） -->
    <BasicForm @register="registerForm">
      <!-- 应用负责人选择 -->
      <template #managers="{ model, field }">
        <StaffSelectUser 
          v-model:value="model[field]" 
          placeholder="请选择应用负责人"
          :mode="'multiple'"
          :rowKey="'id'"
          :labelKey="'name'"
        />
      </template>
      <!-- 现有项目：Git地址下拉（可搜索） -->
      <template #gitUrl="{ model, field }">
        <a-input
          v-model:value="model[field]"
          allow-clear
          placeholder="请输入Git地址"
          style="width: 100%"
        />
      </template>
      <!-- 新建项目：模板下拉（允许不选择） -->
      <template #templateType="{ model, field }">
        <a-select
          v-model:value="model[field]"
          :options="templateOptions"
          allow-clear
          show-search
          :filter-option="filterTemplateOption"
          placeholder="请选择应用模板（可不选）"
          style="width: 100%"
        />
      </template>
    </BasicForm>
  </BasicDrawer>
</template>

<script lang="ts">
  import { ref, computed, unref } from 'vue';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { saveApp, editApp, createGitRepo, getGitRepos } from '../AppManage.api';
  import { formSchema } from '../AppManage.data';
  import type { AppManageModel } from '../AppManage.data';
  import StaffSelectUser from './StaffSelectUser.vue';
  import { getTemplateList } from '/@/views/material/material.api';

  export default {
    name: 'AppManageModal',
    components: { BasicDrawer, BasicForm, StaffSelectUser },
    emits: ['success', 'register'],
    setup(_, { emit }) {
      const { createMessage } = useMessage();
      const isUpdate = ref(true);
      const rowId = ref('');
      const confirmLoading = ref(false);
      const templateOptions = ref<Array<{ label: string; value: string }>>([]);

      const gitUrlOptions = ref<Array<{ label: string; value: string }>>([]);
      const selectedGitPrefix = ref<string>('');
      const envGitPrefix = (import.meta as any)?.env?.VITE_GIT_PREFIX || (import.meta as any)?.env?.VITE_GITHUB_PREFIX || '';

      const [registerForm, { setFieldsValue, resetFields, validate, updateSchema, getFieldsValue }] = useForm({
        labelWidth: 100,
        baseColProps: { span: 24 },
        // 动态表单：schema 在 AppManage.data.ts 中控制字段显隐
        schemas: formSchema,
        showActionButtonGroup: false,
        autoSubmitOnEnter: true,
      });

      const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
        resetFields();
        // 开启底部确认/取消按钮
        setDrawerProps({ showFooter: true, showOkBtn: true, showCancelBtn: true, confirmLoading: false });
        isUpdate.value = !!data?.isUpdate;

        // 使用环境变量作为固定的 Git 前缀
        selectedGitPrefix.value = (envGitPrefix || '').trim();

        if (unref(isUpdate)) {
          rowId.value = data.record.id;
          // 等待表单渲染完成再进行字段回填，避免未挂载导致回显失败
          try { const { nextTick } = await import('vue'); await nextTick(); } catch {}
          // 负责人字段预处理：支持数组、逗号分隔字符串、JSON字符串
          const normalizeManagers = (val: any): string[] => {
            if (Array.isArray(val)) return (val || []).map((v) => String(v)).filter(Boolean);
            if (typeof val === 'string') {
              const s = val.trim();
              if (!s) return [];
              try {
                const arr = JSON.parse(s);
                if (Array.isArray(arr)) return arr.map((v) => String(v)).filter(Boolean);
              } catch {}
              return s.split(',').map((v) => v.trim()).filter(Boolean);
            }
            return [];
          };

          setFieldsValue({
            ...data.record,
            managers: normalizeManagers(data?.record?.managers),
          });

          // 编辑模式：不显示“项目来源”，且显示“已有项目”相关字段，隐藏“新建项目”相关字段
          updateSchema?.([
            { field: 'projectSource', show: false },
            { field: 'gitUrl', show: true },
            { field: 'appPath', show: false },
            { field: 'repoName', show: false },
            { field: 'gitUrlNew', show: false },
            { field: 'templateType', show: false },
          ]);
        } else {
          // 新增：加载模板下拉选项
          await loadTemplateOptions();
          // 初始化：根据当前（可能为空）的项目类型与名称生成 Git 地址
          handleAutoGenGitUrl();

          // 新建模式：显示“项目来源”与新建相关字段，隐藏“已有项目”字段
          updateSchema?.([
            { field: 'projectSource', show: true },
            { field: 'appPath', show: true },
            { field: 'repoName', show: true },
            { field: 'gitUrlNew', show: true },
            { field: 'templateType', show: true },
          ]);

          // 等待表单渲染完成后再进行 schema 更新，避免“form instance 未获取”的报错
          try { const { nextTick } = await import('vue'); await nextTick(); } catch {}

          // 监听项目类型与项目名称变化，自动生成 Git 地址（仅在新建时）
          updateSchema?.([
            {
              field: 'appPath',
              componentProps: {
                onChange: () => handleAutoGenGitUrl(),
              },
            },
            {
              field: 'repoName',
              componentProps: {
                onInput: () => handleAutoGenGitUrl(),
                onChange: () => handleAutoGenGitUrl(),
              },
            },
            // 切换“项目来源”时，依靠 ifShow 动态显隐，无需强制隐藏 gitUrl
            {
              field: 'projectSource',
              componentProps: {
                onChange: () => {
                  // 当切换为 new 时，尝试生成一次地址；切换为 existing 时不处理
                  handleAutoGenGitUrl();
                },
              },
            },
          ]);
        }
      });

      /**
       * 抽屉标题
       */
      const getTitle = computed(() => {
        return unref(isUpdate) ? '编辑应用' : '新增应用';
      });

      /** 加载模板下拉选项 */
      async function loadTemplateOptions() {
        try {
          const res = await getTemplateList({ type: 'application', pageSize: 100 });
          const records = res?.result?.records || res?.records || [];
          templateOptions.value = [
            // 可选择“空白模板”
            { label: '空白模板', value: 'blank' },
            // 其余模板
            ...records.map((item: any) => ({ label: item.name, value: item.id })),
          ];
        } catch (e) {
          console.warn('加载模板选项失败', e);
          templateOptions.value = [{ label: '空白模板', value: 'blank' }];
        }
      }

      /** 模板选项过滤（本地过滤） */
      function filterTemplateOption(input: string, option: any) {
        return (option?.label ?? '').toLowerCase().includes((input ?? '').toLowerCase());
      }

      // 注意：不要在组件 setup 阶段调用 updateSchema（此时表单实例尚未注册），
      // 对 schema 的动态更新已在抽屉打开后（useDrawerInner 回调中）处理。

      function handleAutoGenGitUrl() {
        const values: any = getFieldsValue?.() || {};
        if (values?.projectSource !== 'new') return;
        const path = values?.appPath || '';
        const name = values?.repoName || '';
        if (!name) {
          // 名称为空时，清空自动地址，避免误导
          setFieldsValue({ gitUrlNew: undefined });
          return;
        }
        const repoName = path ? `${path}-${name}` : name;
        // 固定使用 http 前缀，且不区分平台
        const repoUrl = `http://${repoName}`;
        console.log(repoUrl,'-------')
        setFieldsValue({ gitUrlNew: repoUrl });
      }

      /**
       * 提交表单
       */
      async function handleSubmit() {
        try {
          const values = await validate();
          confirmLoading.value = true;
          setDrawerProps({ confirmLoading: true });

          // 构建提交数据
          const submitData: Partial<AppManageModel> = {
            ...values,
          };

          // 负责人字段提交转换：统一为逗号分隔字符串
          const mVal: any = values?.managers;
          submitData.managers = Array.isArray(mVal)
            ? (mVal as any[]).map((v) => String(v)).filter(Boolean).join(',')
            : (typeof mVal === 'string' ? mVal : '');

          if (unref(isUpdate)) {
            submitData.id = rowId.value;
          } else {
            // 新增时添加模板信息（允许不选择）
            submitData.templateType = values?.templateType || undefined;
          }

          // 如果是新增并选择了“创建新项目”，先创建Git仓库
          if (!unref(isUpdate) && values.projectSource === 'new') {
            try {
              // 使用新建表单中的 git 地址（可手动覆盖自动生成）
              const repoUrl = values.gitUrlNew || '';
              const name = values.repoName || '';
              if (!name) {
                createMessage.error('项目名称缺失');
                confirmLoading.value = false;
                setDrawerProps({ confirmLoading: false });
                return;
              }
              if (!repoUrl) {
                createMessage.error('Git地址缺失');
                confirmLoading.value = false;
                setDrawerProps({ confirmLoading: false });
                return;
              }

              // 写入到提交数据
              submitData.gitUrl = repoUrl as any;

              // 不再从 Cookie 读取 GitHub OAuth Token，改为由后端代理使用绑定令牌
              const gitResp = await createGitRepo({
                gitUrl: repoUrl,
                visibility: 'private',
              });
              if (!gitResp?.success) {
                createMessage.error(gitResp?.message || '创建Git仓库失败');
                confirmLoading.value = false;
                setDrawerProps({ confirmLoading: false });
                return;
              }
              // 使用后端返回的仓库地址（如有）
              if (gitResp?.result?.repoUrl) {
                submitData.gitUrl = gitResp.result.repoUrl;
              }
            } catch (e) {
              console.error('创建Git仓库异常:', e);
              createMessage.error('创建Git仓库异常，请检查权限或令牌');
              confirmLoading.value = false;
              setDrawerProps({ confirmLoading: false });
              return;
            }
          }

          // 调用API（更新使用 edit，新增使用 save）
          const result = unref(isUpdate)
            ? await editApp(submitData)
            : await saveApp(submitData);
          console.log(result,'result')
          if (result?.success) {
            handleSuccess(result.result);
          } else {
            createMessage.error(result?.message || '提交失败');
          }
        } catch (error) {
          console.error('提交失败:', error);
          createMessage.error('提交失败，请检查表单数据');
        } finally {
          confirmLoading.value = false;
          setDrawerProps({ confirmLoading: false });
        }
      }

      /**
       * 提交成功回调
       */
      function handleSuccess(result) {
        createMessage.success(unref(isUpdate) ? '编辑成功' : '新增成功');
        closeDrawer();
        emit('success', result); // 传递创建的应用信息，用于跳转到应用详情页
      }
      
      // 搜索现有仓库
      async function onGitSearch(query: string) {
        try {
          const resp = await getGitRepos({ query });
          const list = resp?.result?.repos || resp?.result || [];
          gitUrlOptions.value = (list || [])
            .slice(0, 50)
            .map((item: any) => {
              // 统一使用 web_url/html_url/url，并清洗反引号与空白
              const webUrlRaw = item?.web_url ?? item?.url ?? item?.html_url ?? '';
              const webUrl = String(webUrlRaw).replace(/`/g, '').trim();

              // 将网页地址转换为可 git clone 的 HTTPS 地址（origin + pathname + .git）
              let cloneHttpUrl = webUrl;
              try {
                if (webUrl) {
                  const u = new URL(webUrl);
                  cloneHttpUrl = `${u.origin}${u.pathname.replace(/\/$/, '')}.git`;
                }
              } catch {}

              const displayName = item?.name || item?.full_name || cloneHttpUrl || webUrl;
              const displayUrl = cloneHttpUrl || webUrl;
              return {
                label: displayName && displayUrl ? `${displayName} (${displayUrl})` : (displayUrl || displayName),
                value: displayUrl,
              };
            })
            .filter((opt: any) => !!opt.value);
        } catch (e) {
          console.warn('搜索仓库失败', e);
        }
      }

      return {
        registerDrawer,
        registerForm,
        getTitle,
        handleSubmit,
        confirmLoading,
        isUpdate,
        gitUrlOptions,
        onGitSearch,
        templateOptions,
        filterTemplateOption,
      };
    },
  };
</script>

<style lang="less" scoped>
  :deep(.ant-form-item-label) {
    font-weight: 500;
  }

  :deep(.ant-input),
  :deep(.ant-select-selector),
  :deep(.ant-input-number) {
    border-radius: 6px;
  }

  :deep(.ant-form-item-explain-error) {
    font-size: 12px;
  }
</style>