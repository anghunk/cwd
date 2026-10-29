<template>
	<div class="login-page">
		<div class="login-container">
			<div class="login-card">
				<div class="login-heading">
					<div class="login-brand"><img :src="brandLogo" class="login-icon" width="42" height="42" alt="" /><span>CWD</span></div>
					<h1 class="login-title">{{ t('login.title') }}</h1>
					<p class="login-subtitle">{{ t('login.subtitle') }}</p>
				</div>
				<form class="login-form" @submit.prevent="handleSubmit">
					<div class="form-item">
						<label class="form-label" for="login-api-url">{{ t('login.apiAddress') }}</label>
						<input id="login-api-url" v-model="apiBaseUrl" class="form-input" type="url" autocomplete="url" />
					</div>
					<div class="form-item">
						<label class="form-label" for="login-admin-name">{{ t('login.account') }}</label>
						<input id="login-admin-name" v-model="name" class="form-input" type="text" autocomplete="username" />
					</div>
					<div class="form-item">
						<label class="form-label" for="login-password">{{ t('login.password') }}</label>
						<div class="form-input-wrapper">
							<input
								id="login-password"
								v-model="password"
								class="form-input"
								:type="showPassword ? 'text' : 'password'"
								autocomplete="current-password" />
							<button
								type="button"
								class="password-toggle"
								:aria-label="showPassword ? t('login.hidePassword') : t('login.showPassword')"
								@click="showPassword = !showPassword">
								<PhEye v-if="!showPassword" :size="16" />
								<PhEyeSlash v-else :size="16" />
							</button>
						</div>
					</div>
					<div v-if="error" class="form-error" role="alert">{{ error }}</div>
					<button class="form-button" type="submit" :disabled="submitting">
						<span v-if="submitting">{{ t('login.submitting') }}</span>
						<span v-else>{{ t('login.submit') }}</span>
						<PhArrowRight v-if="!submitting" :size="16" aria-hidden="true" />
					</button>
				</form>
				<div class="login-links">
					<a href="https://cwd.js.org" target="_blank" rel="noreferrer">{{ t('layout.docs') }}<PhArrowUpRight :size="12" /></a
					><span aria-hidden="true">·</span
					><a href="https://github.com/anghunk/cwd" target="_blank" rel="noreferrer">GitHub<PhArrowUpRight :size="12" /></a>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import brandLogo from '../../styles/images/logo.png';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { loginAdmin } from '../../api/admin';

const router = useRouter();
const { t } = useI18n();
const defaultAdminName = (import.meta.env.VITE_ADMIN_NAME || '').trim();
const defaultAdminPassword = (import.meta.env.VITE_ADMIN_PASSWORD || '').trim();
const name = ref(defaultAdminName);
const password = ref(defaultAdminPassword);
const showPassword = ref(false);
const submitting = ref(false);
const error = ref('');
const apiBaseUrl = ref('');

const rawEnvApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const defaultApiBaseUrl = rawEnvApiBaseUrl.replace(/\/+$/, '');

onMounted(() => {
	const stored = (localStorage.getItem('cwd_admin_api_base_url') || '').trim();
	if (stored) {
		apiBaseUrl.value = stored;
		return;
	}
	apiBaseUrl.value = defaultApiBaseUrl;
});

/** 校验登录表单，并使用填写的 API 地址执行现有认证流程。 */
async function handleSubmit() {
	const normalizedApiBaseUrl = apiBaseUrl.value.trim().replace(/\/+$/, '');
	if (!normalizedApiBaseUrl) {
		error.value = t('login.missingApi');
		return;
	}
	if (!name.value || !password.value) {
		error.value = t('login.missingCredentials');
		return;
	}
	error.value = '';
	submitting.value = true;
	try {
		localStorage.setItem('cwd_admin_api_base_url', normalizedApiBaseUrl);
		await loginAdmin(name.value, password.value);
		router.push({ name: 'comments' });
	} catch (e: any) {
		error.value = e.message || t('login.failed');
	} finally {
		submitting.value = false;
	}
}
</script>

<style scoped lang="less">
@import '../../styles/components/login.less';
</style>
