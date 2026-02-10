<template>
  <div class="domain-settings">
    <div class="domain-settings-desc">
      配置后台可见的站点。左侧为后台下拉框中显示的站点，右侧为数据库中发现的所有站点。支持拖拽或点击按钮移动。
    </div>

    <div class="domain-transfer">
      <!-- Visible Domains (Left) -->
      <div class="transfer-panel">
        <div class="transfer-header">后台显示站点 ({{ visibleList.length }})</div>
        <div class="transfer-body" @dragover.prevent @drop="onDrop($event, 'visible')">
          <div v-if="visibleList.length === 0" class="transfer-empty">
            无站点 (默认显示全部)
          </div>
          <div
            v-for="domain in visibleList"
            :key="domain"
            class="transfer-item"
            draggable="true"
            @dragstart="onDragStart($event, domain, 'visible')"
            @dblclick="moveToHidden(domain)"
          >
            <span class="domain-text">{{ getSiteLabel(domain) }}</span>
            <button class="move-btn" @click="moveToHidden(domain)" title="移出">
              <PhArrowRight :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="transfer-actions">
        <button class="action-btn" @click="moveAllToVisible" title="全部左移">
          <PhCaretDoubleLeft />
        </button>
        <button class="action-btn" @click="moveAllToHidden" title="全部右移">
          <PhCaretDoubleRight />
        </button>
      </div>

      <!-- Hidden/All Domains (Right) -->
      <div class="transfer-panel">
        <div class="transfer-header">其他站点 ({{ hiddenList.length }})</div>
        <div class="transfer-body" @dragover.prevent @drop="onDrop($event, 'hidden')">
          <div v-if="hiddenList.length === 0" class="transfer-empty">无更多站点</div>
          <div
            v-for="domain in hiddenList"
            :key="domain"
            class="transfer-item"
            draggable="true"
            @dragstart="onDragStart($event, domain, 'hidden')"
            @dblclick="moveToVisible(domain)"
          >
            <button class="move-btn" @click="moveToVisible(domain)" title="移入">
              <PhArrowLeft :size="16" />
            </button>
            <span class="domain-text">{{ getSiteLabel(domain) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-primary" @click="handleSave" :disabled="loading">
        {{ loading ? "保存中..." : "保存" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  fetchSiteList,
  fetchFeatureSettings,
  saveFeatureSettings,
} from "../../../api/admin";

const loading = ref(false);
const allDomains = ref<string[]>([]);
const visibleList = ref<string[]>([]);

const hiddenList = computed(() => {
  const visibleSet = new Set(visibleList.value);
  return allDomains.value.filter((d) => !visibleSet.has(d));
});

function getSiteLabel(value: string) {
  if (!value) {
    return "默认站点 (Default)";
  }
  return value;
}

async function loadData() {
  try {
    const [siteRes, settingsRes] = await Promise.all([
      fetchSiteList(),
      fetchFeatureSettings(),
    ]);

    allDomains.value = siteRes.sites || [];
    if (settingsRes.visibleDomains) {
      visibleList.value = settingsRes.visibleDomains;
    } else {
      visibleList.value = [];
    }
  } catch (e) {
    console.error(e);
  }
}

function moveToHidden(domain: string) {
  visibleList.value = visibleList.value.filter((d) => d !== domain);
}

function moveToVisible(domain: string) {
  if (!visibleList.value.includes(domain)) {
    visibleList.value.push(domain);
  }
}

function moveAllToVisible() {
  const current = new Set(visibleList.value);
  hiddenList.value.forEach((d) => current.add(d));
  visibleList.value = Array.from(current);
}

function moveAllToHidden() {
  visibleList.value = [];
}

function onDragStart(event: DragEvent, domain: string, source: "visible" | "hidden") {
  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", JSON.stringify({ domain, source }));
    event.dataTransfer.effectAllowed = "move";
  }
}

function onDrop(event: DragEvent, target: "visible" | "hidden") {
  const data = event.dataTransfer?.getData("text/plain");
  if (data) {
    try {
      const { domain, source } = JSON.parse(data);
      if (source !== target) {
        if (target === "visible") {
          moveToVisible(domain);
        } else {
          moveToHidden(domain);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleSave() {
  loading.value = true;
  try {
    await saveFeatureSettings({
      visibleDomains: visibleList.value,
    });
    // 保存成功后刷新页面以应用更改（LayoutView 重新加载）
    window.location.reload();
  } catch (e) {
    alert("保存失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style lang="less" scoped>
.domain-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.domain-settings-desc {
  color: var(--text-secondary);
  font-size: 14px;
}

.domain-transfer {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  height: 400px;

  @media (max-width: 768px) {
    flex-direction: column;
    height: auto;
  }
}

.transfer-panel {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-card);
  min-height: 300px;
  width: 100%;
}

.transfer-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  background: var(--bg-body);
  border-radius: 8px 8px 0 0;
  color: var(--text-primary);
}

.transfer-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.transfer-empty {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 40px;
  font-size: 13px;
}

.transfer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-body);
  border-radius: 6px;
  cursor: grab;
  user-select: none;
  transition: background 0.2s;
  color: var(--text-primary);

  &:hover {
    background: var(--bg-hover);
  }

  &:active {
    cursor: grabbing;
  }

  .domain-text {
    flex: 1;
    margin: 0 10px;
    word-break: break-all;
  }
}

.move-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;

  &:hover {
    background: var(--bg-active);
    color: var(--primary-color);
  }
}

.transfer-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: center;

  @media (max-width: 768px) {
    flex-direction: row;
  }
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

.form-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  padding: 8px 24px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
</style>
