<template>
	<div class="layout" @keydown.esc="closeOverlays">
		<aside
			id="admin-navigation"
			class="layout-sider"
			:class="{ 'layout-sider-mobile-open': isMobileSiderOpen }"
			:aria-label="t('ui.workspace')">
			<div class="layout-brand">
				<img :src="brandLogo" class="layout-brand-icon" width="36" height="36" alt="CWD" />
				<div class="layout-brand-text">
					<div class="layout-title" :title="layoutTitle">{{ layoutTitle }}</div>
					<div class="layout-brand-caption">{{ t('ui.console') }}</div>
				</div>
			</div>
			<div class="layout-site">
				<label class="layout-section-label" for="admin-site">{{ t('ui.currentSite') }}</label>
				<div class="layout-site-control">
					<PhGlobe :size="16" aria-hidden="true" />
					<select id="admin-site" v-model="currentSiteId" class="layout-domain-select">
						<option :value="defaultSiteId">{{ getSiteLabel(defaultSiteId) }}</option>
						<option v-for="item in siteOptions" :key="item.value" :value="item.value">{{ getSiteLabel(item.value) }}</option>
					</select>
				</div>
			</div>
			<nav class="layout-navigation">
				<div v-for="group in navigationGroups" :key="group.label" class="menu-group">
					<div class="layout-section-label">{{ t(group.label) }}</div>
					<ul class="menu">
						<li v-for="item in group.items" :key="item.name">
							<button
								class="menu-item"
								:class="{ active: isRouteActive(item.name) }"
								:aria-current="isRouteActive(item.name) ? 'page' : undefined"
								type="button"
								@click="navigateTo(item.name)">
								<span class="menu-item-icon"
									><component :is="item.icon" :size="17" :weight="isRouteActive(item.name) ? 'fill' : 'regular'"
								/></span>
								<span>{{ t(`menu.${item.name}`) }}</span>
								<PhCaretRight v-if="isRouteActive(item.name)" class="menu-item-chevron" :size="12" aria-hidden="true" />
							</button>
						</li>
					</ul>
				</div>
			</nav>
			<button class="layout-sider-footer" type="button" @click="openVersionModal" :aria-label="t('layout.version.title')">
				<span class="layout-footer-icon"><PhInfo :size="17" /></span>
				<span class="layout-footer-copy"
					><span>{{ t('layout.version.title') }}</span
					><span class="layout-footer-versions">Admin {{ adminVersion }} · API {{ apiVersion || '—' }}</span></span
				>
				<PhCaretRight :size="12" aria-hidden="true" />
			</button>
		</aside>
		<div v-if="isMobileSiderOpen" class="layout-sider-mask" @click="closeSider" />
		<div class="layout-workspace">
			<header class="layout-header">
				<button
					class="layout-menu-toggle"
					type="button"
					@click="toggleSider"
					:aria-label="t('layout.toggleMenu')"
					:aria-expanded="isMobileSiderOpen"
					aria-controls="admin-navigation">
					<PhList :size="20" />
				</button>
				<div class="layout-breadcrumb">
					<span>{{ t('ui.workspace') }}</span
					><PhCaretRight :size="11" aria-hidden="true" /><span class="layout-breadcrumb-current">{{ currentPageTitle }}</span>
				</div>
				<div class="layout-actions-wrapper">
					<div class="layout-actions">
						<a class="layout-button" href="https://cwd.js.org" target="_blank" rel="noreferrer"
							><PhBookOpen :size="16" />{{ t('layout.docs') }}<PhArrowUpRight :size="11"
						/></a>
						<a
							class="layout-button layout-icon-button"
							href="https://github.com/anghunk/cwd"
							target="_blank"
							rel="noreferrer"
							aria-label="GitHub"
							><PhGithubLogo :size="18"
						/></a>
					</div>
					<button class="layout-button layout-icon-button" type="button" @click="cycleTheme" :title="themeTitle" :aria-label="themeTitle">
						<PhSun v-if="theme === 'light'" :size="17" /><PhMoon v-else-if="theme === 'dark'" :size="17" /><PhDesktop v-else :size="17" />
					</button>
					<button class="layout-button layout-logout" type="button" @click="openLogoutDialog">
						<PhSignOut :size="16" />{{ t('layout.logout') }}
					</button>
					<button
						ref="actionsToggle"
						class="layout-actions-toggle"
						type="button"
						@click="toggleActions"
						:aria-label="t('layout.moreActions')"
						:aria-expanded="isActionsOpen">
						<PhDotsThree :size="22" />
					</button>
					<div v-if="isActionsOpen" class="layout-actions-mask" @click="closeActions" />
					<div v-if="isActionsOpen" class="layout-actions-dropdown">
						<button class="layout-actions-item" type="button" @click="openDocs"><PhBookOpen :size="16" />{{ t('layout.docs') }}</button>
						<button class="layout-actions-item" type="button" @click="openGithub"><PhGithubLogo :size="16" />GitHub</button>
						<button class="layout-actions-item layout-actions-item-danger" type="button" @click="openLogoutDialog">
							<PhSignOut :size="16" />{{ t('layout.logout') }}
						</button>
					</div>
				</div>
			</header>
			<main id="main-content" class="layout-content"><router-view /></main>
		</div>
		<dialog
			ref="logoutDialog"
			class="logout-dialog"
			aria-labelledby="logout-dialog-title"
			aria-describedby="logout-dialog-description"
			@click.self="logoutDialog?.close()"
			@close="handleLogoutDialogClose">
			<form method="dialog" class="logout-dialog-form">
				<h3 id="logout-dialog-title" class="logout-dialog-title">{{ t('layout.logoutDialog.title') }}</h3>
				<p id="logout-dialog-description" class="logout-dialog-description">{{ t('layout.logoutDialog.description') }}</p>
				<div class="logout-dialog-actions">
					<button class="card-button secondary" type="submit" value="cancel" autofocus>{{ t('layout.logoutDialog.cancel') }}</button>
					<button class="card-button" type="submit" value="confirm">{{ t('layout.logoutDialog.confirm') }}</button>
				</div>
			</form>
		</dialog>
		<div v-if="versionModalVisible" class="version-modal-overlay" @click.self="closeVersionModal">
			<div class="version-modal" role="dialog" aria-modal="true" aria-labelledby="version-modal-title">
				<h3 id="version-modal-title" class="version-modal-title">
					{{ t('layout.version.title') }}
				</h3>
				<div class="version-modal-body">
					<p class="version-modal-row">
						<span class="version-modal-label">{{ t('layout.version.apiAddress') }}</span>
						<span class="version-modal-value">{{ checkedApiBaseUrl || t('layout.version.notConfigured') }}</span>
					</p>
					<p class="version-modal-row">
						<span class="version-modal-label">{{ t('layout.version.apiVersion') }}</span>
						<span class="version-modal-value">
							{{ apiVersion || (apiVersionError ? t('layout.version.notFetched') : t('layout.version.loading')) }}
						</span>
					</p>
					<p class="version-modal-row">
						<span class="version-modal-label">{{ t('layout.version.adminVersion') }}</span>
						<span class="version-modal-value">{{ adminVersion }}</span>
					</p>
					<p v-if="versionStatusText" class="version-modal-status" :class="versionStatusClass">
						{{ versionStatusText }}
					</p>
				</div>
				<div class="version-modal-actions">
					<button class="version-modal-btn" type="button" @click="closeVersionModal">
						{{ t('layout.version.ok') }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import brandLogo from '../../styles/images/logo.png';
import { ref, onMounted, provide, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { logoutAdmin, fetchAdminDisplaySettings, fetchSiteList } from '../../api/admin';
import { useTheme } from '../../composables/useTheme';
import { useSite } from '../../composables/useSite';
import packageJson from '../../../package.json';

const API_BASE_URL_KEY = 'cwd_admin_api_base_url';
const SITE_TITLE_KEY = 'cwd_admin_site_title';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { theme, setTheme } = useTheme();
const { currentSiteId } = useSite();

const navigationGroups = [
	{
		label: 'ui.workspace',
		items: [
			{ name: 'comments', icon: 'PhChatCircleDots' },
			{ name: 'stats', icon: 'PhSquaresFour' },
			{ name: 'analytics', icon: 'PhChartBar' },
		],
	},
	{
		label: 'ui.management',
		items: [
			{ name: 'settings', icon: 'PhGear' },
			{ name: 'data', icon: 'PhDatabase' },
		],
	},
];
const currentPageTitle = computed(() => t(`menu.${String(route.name)}`));

const isMobileSiderOpen = ref(false);
const isActionsOpen = ref(false);
const actionsToggle = ref<HTMLButtonElement | null>(null);
const logoutDialog = ref<HTMLDialogElement | null>(null);
let logoutReturnFocus: HTMLElement | null = null;
const adminVersion = ref(packageJson.version || '0.0.0');
const apiVersion = ref('');
const checkedApiBaseUrl = ref('');
const apiVersionError = ref('');
const versionModalVisible = ref(false);
const layoutTitle = ref(localStorage.getItem(SITE_TITLE_KEY) || 'CWD 评论系统');

const themeTitle = computed(() => {
	if (theme.value === 'light') return t('layout.theme.light');
	if (theme.value === 'dark') return t('layout.theme.dark');
	return t('layout.theme.system');
});

const versionStatusClass = computed(() => {
	if (!apiVersion.value) return apiVersionError.value ? 'is-error' : '';
	return apiVersion.value === adminVersion.value ? 'is-match' : 'is-mismatch';
});

const versionStatusText = computed(() => {
	if (apiVersion.value) {
		return apiVersion.value === adminVersion.value ? t('layout.version.match') : t('layout.version.mismatch');
	}
	if (apiVersionError.value) {
		return `${t('layout.version.fetchError')} ${apiVersionError.value}`;
	}
	return '';
});

function cycleTheme() {
	if (theme.value === 'system') setTheme('light');
	else if (theme.value === 'light') setTheme('dark');
	else setTheme('system');
}

type SiteOption = { label: string; value: string };
const siteOptions = ref<SiteOption[]>([]);
const defaultSiteId = 'default';

function getSiteLabel(value: string) {
	if (!value || value === 'default') {
		return t('layout.defaultSite');
	}
	return value;
}

async function loadSites() {
	try {
		const res = await fetchSiteList();
		const sites = Array.isArray(res.sites) ? res.sites : [];
		const unique = Array.from(new Set(sites));
		siteOptions.value = unique
			.filter((s) => s !== '' && s !== defaultSiteId)
			.map((s) => ({
				label: s,
				value: s,
			}));
	} catch {
		siteOptions.value = [];
	}
}

async function loadVersion() {
	const baseUrl = (localStorage.getItem(API_BASE_URL_KEY) || '').trim();
	if (!baseUrl) {
		checkedApiBaseUrl.value = '';
		apiVersionError.value = '';
		return;
	}
	checkedApiBaseUrl.value = baseUrl;
	apiVersionError.value = '';
	try {
		const res = await fetch(baseUrl);
		const contentType = res.headers.get('content-type') || '';
		if (!res.ok || !contentType.includes('application/json')) {
			apiVersionError.value = '当前 API 版本较旧，未提供版本信息接口。推荐后续升级到最新版本以获得完整的版本检测能力（不影响当前使用）。';
			return;
		}
		const data = await res.json().catch(() => null);
		if (data && typeof data.version === 'string') {
			apiVersion.value = data.version;
		} else {
			apiVersionError.value = '当前 API 版本较旧，未提供版本信息接口。推荐后续升级到最新版本以获得完整的版本检测能力（不影响当前使用）。';
		}
	} catch (e) {
		apiVersionError.value = (e as Error).message || '获取接口版本失败';
	}
}

function updateTitle(newTitle: string) {
	layoutTitle.value = newTitle;
	localStorage.setItem(SITE_TITLE_KEY, newTitle);
	const pageTitle = route.meta.title;
	if (pageTitle) {
		document.title = `${pageTitle} - ${newTitle}`;
	} else {
		document.title = newTitle;
	}
}

async function loadDisplaySettings() {
	try {
		const res = await fetchAdminDisplaySettings();
		const title = res.layoutTitle || 'CWD 评论系统';
		updateTitle(title);
	} catch {
		// 忽略错误，保持当前值或默认值
	}
}

provide('updateSiteTitle', updateTitle);

onMounted(() => {
	loadSites();
	loadVersion();
	loadDisplaySettings();
});

function isRouteActive(name: string) {
	return route.name === name;
}

function closeSider() {
	isMobileSiderOpen.value = false;
}

function toggleSider() {
	isMobileSiderOpen.value = !isMobileSiderOpen.value;
}

function toggleActions() {
	isActionsOpen.value = !isActionsOpen.value;
}

function closeActions() {
	isActionsOpen.value = false;
}

/**
 * 切换后台页面并收起窄屏导航。
 * @param name 已注册的后台路由名称。
 */
function navigateTo(name: string) {
	router.push({ name });
	closeSider();
	closeActions();
}

/** 通过 Escape 收起当前打开的浮层。 */
function closeOverlays() {
	closeSider();
	closeActions();
	closeVersionModal();
}

function openDocs() {
	window.open('https://cwd.js.org', '_blank');
	closeActions();
}

function openGithub() {
	window.open('https://github.com/anghunk/cwd', '_blank');
	closeActions();
}

/**
 * 打开退出确认弹窗，并记录取消后需要恢复焦点的入口。
 * @param event 桌面退出按钮或窄屏菜单项的点击事件。
 */
function openLogoutDialog(event: MouseEvent) {
	logoutReturnFocus = isActionsOpen.value ? actionsToggle.value : event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
	closeSider();
	closeActions();
	if (logoutDialog.value) {
		logoutDialog.value.returnValue = '';
		logoutDialog.value.showModal();
	}
}

/** 仅在确认退出时清除登录凭据；取消、遮罩点击和 Escape 均保留当前会话。 */
function handleLogoutDialogClose() {
	if (logoutDialog.value?.returnValue === 'confirm') {
		logoutAdmin();
		router.push({ name: 'login' });
	} else {
		logoutReturnFocus?.focus();
	}
}

function openVersionModal() {
	loadVersion();
	versionModalVisible.value = true;
}

function closeVersionModal() {
	versionModalVisible.value = false;
}
</script>

<style lang="less">
@import '../../styles/layout.less';

.version-modal-overlay {
	position: fixed;
	inset: 0;
	z-index: 2000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--admin-space-4);
	background-color: var(--admin-overlay);
}

.version-modal {
	display: flex;
	width: min(100%, 440px);
	max-height: calc(100dvh - 32px);
	flex-direction: column;
	gap: var(--admin-space-4);
	padding: var(--admin-space-5);
	overflow-y: auto;
	color: var(--text-primary);
	background-color: var(--bg-card);
	border: 1px solid var(--border-color);
	border-radius: var(--admin-radius-md);
	box-shadow: var(--admin-shadow-md);
	animation: version-modal-in 180ms ease-out;
}

.version-modal-title {
	margin: 0;
	font-size: 16px;
	line-height: 1.4;
	font-weight: 600;
	color: var(--text-primary);
}

.version-modal-body {
	display: flex;
	flex-direction: column;
	gap: var(--admin-space-3);
	font-size: 13px;
	color: var(--text-secondary);
}

.version-modal-row {
	margin: 0;
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	align-items: start;
	gap: var(--admin-space-4);
	line-height: 1.5;
}

.version-modal-label {
	color: var(--text-secondary);
	white-space: nowrap;
}

.version-modal-value {
	min-width: 0;
	color: var(--text-primary);
	text-align: right;
	word-break: break-all;
}

.version-modal-status {
	margin: var(--admin-space-1) 0 0;
	padding: var(--admin-space-2) 10px;
	border: 1px solid var(--border-color);
	border-radius: var(--admin-radius-sm);
	font-size: 13px;
	line-height: 1.5;
	background-color: var(--bg-hover);
}

.version-modal-status.is-match {
	color: var(--color-success);
	background-color: var(--admin-success-soft);
	border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
}

.version-modal-status.is-mismatch {
	color: var(--color-warning);
	background-color: var(--admin-warning-soft);
	border-color: color-mix(in srgb, var(--color-warning) 30%, transparent);
}

.version-modal-status.is-error {
	color: var(--color-danger);
	background-color: var(--admin-danger-soft);
	border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
}

.version-modal-actions {
	display: flex;
	justify-content: flex-end;
}

.version-modal-btn {
	display: inline-flex;
	min-height: var(--admin-control-height);
	align-items: center;
	justify-content: center;
	padding: 0 14px;
	color: var(--text-inverse);
	background-color: var(--primary-color);
	border: 1px solid var(--primary-color);
	border-radius: var(--admin-radius-sm);
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition:
		background-color var(--admin-transition),
		border-color var(--admin-transition),
		box-shadow var(--admin-transition);
}

.version-modal-btn:hover {
	background-color: var(--admin-primary-hover);
	border-color: var(--admin-primary-hover);
}

.version-modal-btn:active {
	background-color: var(--admin-primary-active);
	border-color: var(--admin-primary-active);
}

.version-modal-btn:focus-visible {
	box-shadow: var(--admin-focus-ring);
}

@media (max-width: 640px) {
	.version-modal-overlay {
		align-items: flex-end;
		padding: 0;
	}

	.version-modal {
		width: 100%;
		max-height: 88dvh;
		padding: 20px 16px 24px;
		border-right: none;
		border-bottom: none;
		border-left: none;
		border-radius: var(--admin-radius-md) var(--admin-radius-md) 0 0;
	}

	.version-modal-actions .version-modal-btn {
		min-height: var(--admin-control-height-lg);
		flex: 1;
	}

	.version-modal-actions {
		position: sticky;
		bottom: 0;
		padding-top: var(--admin-space-3);
		background-color: var(--bg-card);
	}
}

@keyframes version-modal-in {
	from {
		opacity: 0;
		transform: translateY(8px) scale(0.98);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style>
