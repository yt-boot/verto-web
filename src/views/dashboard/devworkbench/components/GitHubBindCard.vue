<template>
  <Card title="GitHub账户绑定" v-bind="$attrs">
    <template #extra>
      <span v-if="bindGithubData && bindGithubData.sysUserId" class="text-success">
        已绑定：{{ bindGithubData.realname || 'GitHub 用户' }}
        <a class="ml-3" @click="onUnbindGithub">解绑</a>
      </span>
      <span v-else class="text-warning">未绑定</span>
    </template>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <Icon icon="ant-design:github-outlined" :size="28" color="#24292e" />
        <span class="ml-3 text-md">将您的账户与 GitHub 绑定，以便后续进行代码、流水线等快捷操作。</span>
      </div>
      <!-- 已绑定时隐藏按钮，显示更友好的提示 -->
      <a-button
        v-if="!(bindGithubData && bindGithubData.sysUserId)"
        type="primary"
        @click="onBindGithub"
        :loading="loading"
      >一键绑定 GitHub 账户</a-button>
    </div>
  </Card>
</template>
<script lang="ts" setup>
  import { ref, onMounted, unref } from 'vue';
  import { Card } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { useGlobSetting } from '/@/hooks/setting';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { bindThirdAppAccount, vertoBindThirdAppAccount, getThirdAccountByUserId, deleteThirdAccount, vertoGetThirdAccountByUserId, vertoDeleteThirdAccount } from '/@/views/system/usersetting/UserSetting.api';
  import { Modal } from 'ant-design-vue';

  const glob = useGlobSetting();
  const { createMessage } = useMessage();

  const bindGithubData = ref<any>({});
  const loading = ref(false);
  const windowsIndex = ref<Window | null>(null);
  const receiveMessage = ref<any>(null);
  const thirdType = ref('github');
  const thirdUserUuid = ref('');

  async function initBindStatus() {
    const res = await getThirdAccountByUserId({ thirdType: 'github' });
    if (res && res.result && Array.isArray(res.result)) {
      bindGithubData.value = res.result[0] || {};
    } else {
      bindGithubData.value = {};
    }
  }

  function cmsFailed(msg?: string) {
    createMessage.warning(msg || '第三方账号绑定异常');
  }

  async function bindCurrentUser() {
    const uuid = unref(thirdUserUuid);
    if (!uuid) {
      cmsFailed();
      return;
    }
    loading.value = true;
    try {
      const res = await bindThirdAppAccount({ thirdUserUuid: uuid, thirdType: unref(thirdType) });
      if (res && res.success) {
        // 同时调用 Verto 扩展接口，确保 oauth_binding 创建成功
        try {
          await vertoBindThirdAppAccount({ thirdUserUuid: uuid, thirdType: unref(thirdType) });
        } catch (err) {
          // 忽略扩展接口异常，不影响原有流程
        }
        await initBindStatus();
        createMessage.success(res.message || '绑定成功');
      } else {
        cmsFailed(res?.message);
      }
    } catch (e: any) {
      cmsFailed(e?.message);
    } finally {
      loading.value = false;
    }
  }

  function onBindGithub() {
    // 调用 Verto 专用授权端点，避免与系统内置 /render/{source} 路由冲突
    const url = `${glob.uploadUrl}/sys/thirdLoginVerto/render/${unref(thirdType)}`;

    // 确保只保留一个弹窗与一个监听
    if (unref(windowsIndex)) {
      unref(windowsIndex)?.close();
      window.removeEventListener('message', unref(receiveMessage), false);
    }

    windowsIndex.value = window.open(
      url,
      `login ${unref(thirdType)}`,
      'height=500, width=500, top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no'
    );

    receiveMessage.value = async function (event: MessageEvent) {
      const token = event.data;
      if (typeof token === 'string') {
        if (token === '登录失败') {
          cmsFailed('登录失败');
        } else if (token.includes('绑定手机号')) {
          const strings = token.split(',');
          thirdUserUuid.value = strings[1];
          await bindCurrentUser();
        } else {
          // 已被其它账号绑定的提醒
          if (token) {
            createMessage.warning('该敲敲云账号已被其它第三方账号绑定,请解绑或绑定其它敲敲云账号');
          }
        }
      } else {
        cmsFailed();
      }

      window.removeEventListener('message', unref(receiveMessage), false);
      windowsIndex.value = null;
    };
    window.addEventListener('message', unref(receiveMessage), false);
  }

  /**
   * 解绑 GitHub 账户
   */
  function onUnbindGithub() {
    const data = unref(bindGithubData) || {};
    if (!data.sysUserId || !data.id) {
      createMessage.warning('当前未绑定或数据异常');
      return;
    }
    Modal.confirm({
      title: '解绑 GitHub',
      content: '确定要解绑当前 GitHub 账户吗？',
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        try {
          const res = await deleteThirdAccount({ sysUserId: data.sysUserId, id: data.id });
          if (res && res.success) {
            await initBindStatus();
            createMessage.success(res.message || '解绑成功');
          } else {
            createMessage.warning(res?.message || '解绑失败');
          }
        } catch (e: any) {
          createMessage.error(e?.message || '解绑异常');
        }
      },
    });
  }

  onMounted(() => {
    initBindStatus();
  });
</script>