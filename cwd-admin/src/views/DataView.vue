<template>
  <div class="page">
    <h2 class="page-title">数据管理</h2>
    <div
      v-if="toastVisible"
      class="toast"
      :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
    >
      {{ toastMessage }}
    </div>

    <!-- 1. 评论数据 -->
    <div class="card">
      <h3 class="card-title">评论数据</h3>
      <p class="card-desc">管理评论内容，支持从其他评论框架迁移数据。</p>
      
      <div class="action-row">
        <span class="action-label">导出:</span>
        <button class="card-button secondary" :disabled="exporting" @click="handleExportComments">
          <span v-if="exporting">导出中...</span>
          <span v-else>导出 JSON</span>
        </button>
      </div>

      <div class="action-row">
        <span class="action-label">导入:</span>
        <select v-model="importSource" class="form-select" style="margin-right: 8px; width: 160px;">
          <option value="cwd">CWD (.json)</option>
          <option value="twikoo">Twikoo (.json)</option>
          <option value="artalk">Artalk (.json)</option>
        </select>
        <button class="card-button secondary" :disabled="importing" @click="triggerFileInput('comments')">
          导入评论
        </button>
      </div>
    </div>

    <!-- 2. 系统配置 -->
    <div class="card">
      <h3 class="card-title">系统配置</h3>
      <p class="card-desc">管理后台设置、邮件配置、黑名单等。</p>
      <div class="action-row">
        <button class="card-button secondary" :disabled="exporting" @click="handleExportConfig">导出配置</button>
        <button class="card-button secondary" :disabled="importing" @click="triggerFileInput('config')">导入配置</button>
      </div>
    </div>

    <!-- 3. 访问统计 -->
    <div class="card">
      <h3 class="card-title">访问统计</h3>
      <p class="card-desc">管理文章访问量、点赞数及每日访问趋势。</p>
      <div class="action-row">
        <button class="card-button secondary" :disabled="exporting" @click="handleExportStats">导出统计</button>
        <button class="card-button secondary" :disabled="importing" @click="triggerFileInput('stats')">导入统计</button>
      </div>
    </div>

    <!-- 4. 全量备份 -->
    <div class="card">
      <h3 class="card-title">全量备份</h3>
      <p class="card-desc">一键备份或恢复系统所有数据（评论 + 配置 + 统计）。</p>
      <div class="action-row">
        <button class="card-button secondary" :disabled="exporting" @click="handleExportBackup">全量导出</button>
        <button class="card-button secondary" :disabled="importing" @click="triggerFileInput('backup')">全量恢复</button>
      </div>
    </div>

    <!-- 隐藏的文件输入框 -->
    <input
      type="file"
      ref="fileInput"
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    />

    <!-- 导入日志 -->
    <div v-if="importLogs.length > 0" class="log-container">
      <div class="log-title">操作日志</div>
      <div class="log-list">
        <div v-for="(log, index) in importLogs" :key="index" class="log-item">
          {{ log }}
        </div>
      </div>
    </div>

    <!-- 前缀确认弹窗 -->
    <div v-if="showPrefixModal" class="modal-overlay">
      <div class="modal">
        <h3 class="modal-title">检测到 URL 缺失前缀</h3>
        <p class="modal-desc">
          检测到 <strong>{{ missingPrefixCount }}</strong> 条评论的 URL
          不存在域名前缀（http/https）。<br />
          是否在导入时统一添加？
        </p>
        <div class="form-group">
          <label class="form-label">域名前缀 (例如 https://example.me)</label>
          <input
            v-model="urlPrefix"
            class="form-input"
            placeholder="请输入域名前缀"
            @keyup.enter="confirmPrefix"
          />
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" @click="cancelPrefix">
            直接导入 (不添加)
          </button>
          <button class="modal-btn primary" @click="confirmPrefix">添加并导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { 
  exportComments, importComments,
  exportConfig, importConfig,
  exportStats, importStats,
  exportBackup, importBackup
} from "../api/admin";

const exporting = ref(false);
const importing = ref(false);
const importSource = ref("cwd");
const fileInput = ref<HTMLInputElement | null>(null);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);
const importLogs = ref<string[]>([]);

// 当前导入模式: comments | config | stats | backup
const currentImportMode = ref<string>('comments');

// 前缀处理相关状态
const showPrefixModal = ref(false);
const urlPrefix = ref("");
const missingPrefixCount = ref(0);
const pendingJson = ref<any[]>([]);

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  window.setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
}

function addLog(msg: string) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  importLogs.value.push(`[${timeStr}] ${msg}`);
}

// 通用导出函数
async function executeExport(apiFunc: () => Promise<any>, fileNamePrefix: string) {
  exporting.value = true;
  try {
    const data = await apiFunc();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileNamePrefix}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast("导出成功", "success");
  } catch (e: any) {
    showToast(e.message || "导出失败", "error");
  } finally {
    exporting.value = false;
  }
}

// 导出处理
const handleExportComments = () => executeExport(exportComments, 'comments-export');
const handleExportConfig = () => executeExport(exportConfig, 'cwd-config');
const handleExportStats = () => executeExport(exportStats, 'cwd-stats');
const handleExportBackup = () => executeExport(exportBackup, 'cwd-full-backup');

// 触发文件选择
function triggerFileInput(mode: string) {
  currentImportMode.value = mode;
  importLogs.value = []; // 清空日志
  if (fileInput.value) {
    fileInput.value.value = ''; // 重置 input
    fileInput.value.click();
  }
}

// 文件选择回调
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  importing.value = true;
  addLog(`开始导入: ${file.name} (模式: ${currentImportMode.value})`);
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      let json;
      try {
        json = JSON.parse(content);
      } catch (parseError) {
        throw new Error("JSON 解析失败，请检查文件格式");
      }

      addLog("文件解析成功，开始处理...");
      
      switch (currentImportMode.value) {
        case 'comments':
          await processImportComments(json);
          break;
        case 'config':
          await processImportConfig(json);
          break;
        case 'stats':
          await processImportStats(json);
          break;
        case 'backup':
          await processImportBackup(json);
          break;
      }
      
    } catch (err: any) {
      console.error(err);
      addLog(`错误: ${err.message}`);
      showToast(err.message, "error");
      importing.value = false;
    }
  };
  
  reader.onerror = () => {
    addLog("读取文件失败");
    showToast("读取文件失败", "error");
    importing.value = false;
  };

  reader.readAsText(file);
}

// 导入处理逻辑
async function processImportConfig(data: any) {
  const res = await importConfig(data);
  addLog(res.message);
  showToast("配置导入成功");
  importing.value = false;
}

async function processImportStats(data: any) {
  const res = await importStats(data);
  addLog(res.message);
  showToast("统计数据导入成功");
  importing.value = false;
}

async function processImportBackup(data: any) {
  const res = await importBackup(data);
  addLog(res.message);
  showToast("全量恢复成功");
  importing.value = false;
}

async function processImportComments(json: any) {
  const comments = Array.isArray(json) ? json : [json];
  addLog(`解析到 ${comments.length} 条评论数据`);

  // 检查 URL 前缀 (仅针对评论导入)
  let missingCount = 0;
  for (const item of comments) {
    const url = item.href || item.page_key || item.post_slug;
    if (url && typeof url === "string") {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        missingCount++;
      }
    }
  }

  if (missingCount > 0) {
    addLog(`检测到 ${missingCount} 条 URL 缺失前缀，等待用户确认...`);
    missingPrefixCount.value = missingCount;
    pendingJson.value = comments;
    showPrefixModal.value = true;
    // 暂停，等待 Modal 操作
  } else {
    await executeImportComments(comments);
  }
}

async function executeImportComments(comments: any[]) {
  try {
    const res = await importComments(comments);
    addLog(`导入完成: ${res.message}`);
    showToast("评论导入成功");
  } catch (err: any) {
    throw err;
  } finally {
    importing.value = false;
    pendingJson.value = [];
  }
}

// 前缀确认逻辑
async function confirmPrefix() {
  if (!urlPrefix.value) {
    showToast("请输入域名前缀", "error");
    return;
  }

  let prefix = urlPrefix.value.trim();
  const comments = pendingJson.value.map((item) => {
    const newItem = { ...item };
    
    // Twikoo
    if (newItem.href && typeof newItem.href === "string") {
      if (!newItem.href.startsWith("http://") && !newItem.href.startsWith("https://")) {
        newItem.href = joinUrl(prefix, newItem.href);
      }
    }
    // Artalk
    if (newItem.page_key && typeof newItem.page_key === "string") {
      if (!newItem.page_key.startsWith("http://") && !newItem.page_key.startsWith("https://")) {
        newItem.page_key = joinUrl(prefix, newItem.page_key);
      }
    }
    // CWD
    if (newItem.post_slug && typeof newItem.post_slug === "string") {
      if (!newItem.post_slug.startsWith("http://") && !newItem.post_slug.startsWith("https://")) {
        newItem.post_slug = joinUrl(prefix, newItem.post_slug);
      }
    }
    return newItem;
  });

  showPrefixModal.value = false;
  addLog(`已添加前缀，继续导入...`);
  await executeImportComments(comments);
}

function cancelPrefix() {
  showPrefixModal.value = false;
  addLog("用户跳过前缀添加");
  executeImportComments(pendingJson.value);
}

function joinUrl(prefix: string, path: string): string {
  if (prefix.endsWith("/") && path.startsWith("/")) return prefix + path.substring(1);
  if (!prefix.endsWith("/") && !path.startsWith("/")) return prefix + "/" + path;
  return prefix + path;
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 600px; /* Increased width slightly */
}

.page-title {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.card {
  background-color: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  padding: 16px 18px;
  margin-bottom: 0.5em; /* Reduced spacing */
}

.card-title {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 600;
}

.card-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.action-label {
  font-size: 13px;
  color: var(--text-primary);
  min-width: 40px;
}

.card-button {
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid transparent;
  background-color: var(--primary-color);
  color: var(--text-inverse);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.card-button:hover {
  opacity: 0.9;
}

.card-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-button.secondary {
  background-color: var(--bg-input);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.card-button.secondary:hover {
  background-color: var(--bg-sider);
}

.card-button.success {
  background-color: var(--color-success);
}

.form-select {
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-primary);
  background-color: var(--bg-input);
  outline: none;
}

/* Toast & Log styles same as before */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 220px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  box-shadow: var(--shadow-card);
  z-index: 1000;
}
.toast-success { background-color: var(--color-success); color: var(--text-inverse); }
.toast-error { background-color: var(--color-danger); color: var(--text-inverse); }

.log-container {
  margin-top: 16px;
  padding: 12px;
  background-color: var(--bg-sider);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}
.log-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.log-list { display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; }
.log-item { font-size: 12px; font-family: monospace; color: var(--text-secondary); }

/* Modal Styles */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.modal {
  background-color: var(--bg-card);
  border-radius: 6px;
  width: 400px; max-width: 90%;
  padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}
.modal-title { margin: 0; font-size: 16px; font-weight: 600; }
.modal-desc { margin: 0; font-size: 14px; color: var(--text-secondary); line-height: 1.5; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.modal-btn { padding: 8px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; border: none; }
.modal-btn.primary { background-color: var(--primary-color); color: white; }
.modal-btn.secondary { background-color: var(--bg-sider); color: var(--text-primary); border: 1px solid var(--border-color); }
.form-input { padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; width: 100%; box-sizing: border-box; }
</style>
