<template>
  <div class="layout">
    <header class="layout-header">
      <button
        class="layout-menu-toggle"
        @click="toggleSider"
        :aria-label="t('layout.toggleMenu')"
        type="button"
      >
        <PhTextIndent :size="20" />
      </button>
      <div class="layout-title">{{ layoutTitle }}</div>
      <div class="layout-actions-wrapper">
        <div class="layout-domain-filter layout-domain-filter-header">
          <select v-model="currentSiteId" class="layout-domain-select">
            <option :value="defaultSiteId">{{ getSiteLabel(defaultSiteId) }}</option>
            <option
              v-for="item in siteOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ getSiteLabel(item.value) }}
            </option>
          </select>
        </div>
        <div class="layout-actions">
          <a class="layout-button" href="https://cwd.js.org" target="_blank">
            {{ t('layout.docs') }}
          </a>
          <a class="layout-button" href="https://github.com/anghunk/cwd" target="_blank">
            Github
          </a>
          <button
            class="layout-button"
            @click="cycleTheme"
            :title="themeTitle"
            type="button"
          >
            <PhSun v-if="theme === 'light'" :size="16" />
            <PhMoon v-else-if="theme === 'dark'" :size="16" />
            <PhAirplay v-else :size="16" />
          </button>
          <button class="layout-button" @click="handleLogout">{{ t('layout.logout') }}</button>
        </div>

        <button
          class="layout-actions-toggle"
          @click="toggleActions"
          :aria-label="t('layout.moreActions')"
          type="button"
        >
          <PhDotsThreeVertical :size="20" bold />
        </button>
        <div v-if="isActionsOpen" class="layout-actions-dropdown">
          <button class="layout-actions-item" type="button" @click="openDocs">
            {{ t('layout.docs') }}
          </button>
          <button class="layout-actions-item" type="button" @click="openGithub">
            Github
          </button>
          <button
            class="layout-actions-item layout-actions-item-danger"
            type="button"
            @click="handleLogoutFromActions"
          >
            {{ t('layout.logout') }}
          </button>
        </div>
      </div>
    </header>
    <div class="layout-body">
      <nav
        class="layout-sider"
        :class="{ 'layout-sider-mobile-open': isMobileSiderOpen }"
      >
        <div class="layout-sider-domain-filter">
          <select v-model="currentSiteId" class="layout-domain-select">
            <option :value="defaultSiteId">{{ getSiteLabel(defaultSiteId) }}</option>
            <option
              v-for="item in siteOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ getSiteLabel(item.value) }}
            </option>
          </select>
        </div>
        <ul class="menu">
          <li
            class="menu-item"
            :class="{ active: isRouteActive('comments') }"
            @click="goComments"
          >
            <PhChatCircleDots class="menu-item-icon" :size="18" />
            <span>{{ t('menu.comments') }}</span>
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('stats') }"
            @click="goStats"
          >
            <PhSquaresFour class="menu-item-icon" :size="18" />
            <span>{{ t('menu.stats') }}</span>
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('analytics') }"
            @click="goAnalytics"
          >
            <PhChartBar class="menu-item-icon" :size="18" />
            <span>{{ t('menu.analytics') }}</span>
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('settings') }"
            @click="goSettings"
          >
            <PhGear class="menu-item-icon" :size="18" />
            <span>{{ t('menu.settings') }}</span>
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('data') }"
            @click="goData"
          >
            <PhDatabase class="menu-item-icon" :size="18" />
            <span>{{ t('menu.data') }}</span>
          </li>
        </ul>
        <div class="layout-sider-footer" @click="openVersionModal">
          <div class="layout-sider-footer-line">
            <span>API {{ apiVersion }}</span>
          </div>
          <div class="layout-sider-footer-line">Admin {{ adminVersion }}</div>
        </div>
      </nav>
      <div v-if="isMobileSiderOpen" class="layout-sider-mask" @click="closeSider" />
      <main class="layout-content">
        <router-view />
      </main>
    </div>
    <div v-if="versionModalVisible" class="modal-overlay" @click.self="closeVersionModal">
      <div class="modal">
        <h3 class="modal-title">{{ t('layout.version.title') }}</h3>
        <div class="modal-body">
          <p class="modal-row">
            <span class="modal-label">{{ t('layout.version.apiAddress') }}</span>
            <span class="modal-value">{{ checkedApiBaseUrl || t('layout.version.notConfigured') }}</span>
          </p>
          <p class="modal-row">
            <span class="modal-label">{{ t('layout.version.apiVersion') }}</span>
            <span class="modal-value">
              {{ apiVersion || (apiVersionError ? t('layout.version.notFetched') : t('layout.version.loading')) }}
            </span>
          </p>
          <p class="modal-row">
            <span class="modal-label">{{ t('layout.version.adminVersion') }}</span>
            <span class="modal-value">{{ adminVersion }}</span>
          </p>
          <p v-if="apiVersion && apiVersion === adminVersion" class="modal-status">
            {{ t('layout.version.match') }}
          </p>
          <p v-else-if="apiVersion && apiVersion !== adminVersion" class="modal-status">
            {{ t('layout.version.mismatch') }}
          </p>
          <p v-else-if="apiVersionError" class="modal-status">
            {{ t('layout.version.fetchError') }} {{ apiVersionError }}
          </p>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" type="button" @click="closeVersionModal">
            {{ t('layout.version.ok') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { logoutAdmin, fetchAdminDisplaySettings, fetchSiteList } from "../../api/admin";
import { useTheme } from "../../composables/useTheme";
import { useSite } from "../../composables/useSite";
import packageJson from "../../../package.json";

const API_BASE_URL_KEY = "cwd_admin_api_base_url";
const SITE_TITLE_KEY = "cwd_admin_site_title";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { theme, setTheme } = useTheme();
const { currentSiteId } = useSite();

const isMobileSiderOpen = ref(false);
const isActionsOpen = ref(false);
const adminVersion = ref(packageJson.version || "0.0.0");
const apiVersion = ref("");
const checkedApiBaseUrl = ref("");
const apiVersionError = ref("");
const versionModalVisible = ref(false);
const layoutTitle = ref(localStorage.getItem(SITE_TITLE_KEY) || "CWD 评论系统");

const themeTitle = computed(() => {
  if (theme.value === "light") return t('layout.theme.light');
  if (theme.value === "dark") return t('layout.theme.dark');
  return t('layout.theme.system');
});

function cycleTheme() {
  if (theme.value === "system") setTheme("light");
  else if (theme.value === "light") setTheme("dark");
  else setTheme("system");
}

type SiteOption = { label: string; value: string };
const siteOptions = ref<SiteOption[]>([]);
const defaultSiteId = "default";

function getSiteLabel(value: string) {
  if (!value || value === "default") {
    return t('layout.defaultSite');
  }
  return value;
}

async function loadSites() {
  try {
    const res = await fetchSiteList();
    const sites = Array.isArray(res.sites) ? res.sites : [];
    const unique = Array.from(new Set(sites));
    siteOptions.value = unique.filter((s) => s !== "").map((s) => ({
      label: s,
      value: s,
    }));
  } catch {
    siteOptions.value = [];
  }
}

async function loadVersion() {
  const baseUrl = (localStorage.getItem(API_BASE_URL_KEY) || "").trim();
  if (!baseUrl) {
    checkedApiBaseUrl.value = "";
    apiVersionError.value = "";
    return;
  }
  checkedApiBaseUrl.value = baseUrl;
  apiVersionError.value = "";
  try {
    const res = await fetch(baseUrl);
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) {
      apiVersionError.value =
        "当前 API 版本较旧，未提供版本信息接口。推荐后续升级到最新版本以获得完整的版本检测能力（不影响当前使用）。";
      return;
    }
    const data = await res.json().catch(() => null);
    if (data && typeof data.version === "string") {
      apiVersion.value = data.version;
    } else {
      apiVersionError.value =
        "当前 API 版本较旧，未提供版本信息接口。推荐后续升级到最新版本以获得完整的版本检测能力（不影响当前使用）。";
    }
  } catch (e) {
    apiVersionError.value = (e as Error).message || "获取接口版本失败";
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
    const title = res.layoutTitle || "CWD 评论系统";
    updateTitle(title);
  } catch {
    // 忽略错误，保持当前值或默认值
  }
}

provide("updateSiteTitle", updateTitle);

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

function goComments() {
  router.push({ name: "comments" });
  closeSider();
}

function goStats() {
  router.push({ name: "stats" });
  closeSider();
}

function goAnalytics() {
  router.push({ name: "analytics" });
  closeSider();
}

function goData() {
  router.push({ name: "data" });
  closeSider();
}

function goSettings() {
  router.push({ name: "settings" });
  closeSider();
}

function openDocs() {
  window.open("https://cwd.js.org", "_blank");
  closeActions();
}

function openGithub() {
  window.open("https://github.com/anghunk/cwd", "_blank");
  closeActions();
}

function handleLogout() {
  logoutAdmin();
  router.push({ name: "login" });
  closeSider();
}

function handleLogoutFromActions() {
  closeActions();
  handleLogout();
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
@import "../../styles/layout.less";
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background-color: var(--bg-card);
  border-radius: 10px;
  max-width: 420px;
  width: 100%;
  margin: 10px;
  padding: 20px 20px 18px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.modal-row {
  margin: 0;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.modal-label {
  flex: 0 0 auto;
}

.modal-value {
  flex: 1 1 auto;
  text-align: right;
  word-break: break-all;
}

.modal-status {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.modal-btn {
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  background-color: var(--primary-color);
  color: var(--text-inverse);
}

.modal-btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
</style>
