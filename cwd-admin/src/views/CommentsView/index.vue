<template>
  <div class="page">
    <h2 class="page-title">评论管理</h2>
    <div class="toolbar">
      <div class="toolbar-left">
        <select v-model="statusFilter" class="toolbar-select">
          <option value="">全部状态</option>
          <option value="approved">已通过</option>
          <option value="pending">待审核</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-button" @click="goPage(1)">刷新</button>
      </div>
    </div>
    <div v-if="loading" class="page-hint">加载中...</div>
    <div v-else-if="error" class="page-error">{{ error }}</div>
    <div v-else>
      <div class="comment-table">
        <div class="table-header">
          <div class="table-cell table-cell-author">用户</div>
          <div class="table-cell table-cell-content">评论信息</div>
          <div class="table-cell table-cell-path">评论地址</div>
          <div class="table-cell table-cell-status">状态</div>
          <div class="table-cell table-cell-actions">操作</div>
        </div>
        <div v-for="item in filteredComments" :key="item.id" class="table-row">
          <div class="table-cell table-cell-author">
            <div class="cell-author-wrapper">
              <img
                v-if="item.avatar"
                :src="item.avatar"
                class="cell-avatar"
                :alt="item.name"
              />
              <div class="cell-author-main">
                <div class="cell-author-name">
                  {{ item.name }}
                  <span v-if="item.isAdmin" class="cell-admin-tag">
                    <svg
                      viewBox="0 0 22 22"
                      aria-label="网站管理员"
                      role="img"
                      class="cwd-admin-icon"
                      style="
                        width: 15px;
                        height: 15px;
                        fill: currentColor;
                        color: #db850d;
                        vertical-align: -0.15em;
                      "
                    >
                      <g>
                        <path
                          d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                        ></path>
                      </g>
                    </svg>
                  </span>
                </div>
                <div class="cell-author-email">
                  <span
                    class="cell-email-text"
                    @click="handleBlockEmail(item)"
                    title="屏蔽该邮箱"
                  >
                    {{ item.email }}
                  </span>
                </div>
                <span class="cell-time">{{ formatDate(item.created) }}</span>
                <div v-if="item.ipAddress" class="cell-author-ip">
                  <span
                    class="cell-ip-text"
                    @click="handleBlockIp(item)"
                    title="屏蔽该 IP"
                    >{{ item.ipAddress }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="table-cell table-cell-content">
            <div class="cell-content-text" v-html="item.contentHtml"></div>
          </div>
          <div class="table-cell table-cell-path">
            <a
              :href="item.postSlug"
              target="_blank"
              class="cell-path"
              :title="item.postSlug"
              >{{ item.postSlug }}</a
            >
          </div>
          <div class="table-cell table-cell-status">
            <div class="cell-status-wrapper">
              <span class="cell-status" :class="`cell-status-${item.status}`">
                {{ formatStatus(item.status) }}
              </span>
              <span
                v-if="item.priority && item.priority > 1"
                :title="String(item.priority)"
                class="cell-status cell-pin-flag"
              >
                置顶
              </span>
              <span class="cell-status cell-likes-number" v-if="item.likes !== 0">
                <PhThumbsUp :size="13" />

                {{
                  typeof item.likes === "number" &&
                  Number.isFinite(item.likes) &&
                  item.likes >= 0
                    ? item.likes
                    : 0
                }}</span
              >
            </div>
          </div>
          <div class="table-cell table-cell-actions">
            <div class="table-actions">
              <select
                class="status-select"
                :value="item.status"
                @change="handleStatusChange(item, $event)"
              >
                <option value="approved">通过</option>
                <option value="pending">待审</option>
                <option value="rejected">拒绝</option>
              </select>
              <button class="table-action" @click="openEdit(item)">编辑</button>
              <button
                class="table-action table-action-danger"
                @click="removeComment(item)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
        <div v-if="filteredComments.length === 0" class="table-empty">暂无数据</div>
      </div>
      <div v-if="pagination.total > 1" class="pagination">
        <button
          class="pagination-button"
          :disabled="pagination.page <= 1"
          @click="goPage(pagination.page - 1)"
        >
          上一页
        </button>
        <button
          class="pagination-button"
          :class="{ 'pagination-button-active': pagination.page === 1 }"
          :disabled="pagination.page === 1"
          @click="goPage(1)"
        >
          1
        </button>
        <span
          v-if="visiblePages.length && visiblePages[0] > 2"
          class="pagination-ellipsis"
        >
          ...
        </span>
        <template v-for="page in visiblePages">
          <button
            v-if="page !== 1 && page !== pagination.total"
            :key="page"
            class="pagination-button"
            :class="{ 'pagination-button-active': page === pagination.page }"
            :disabled="page === pagination.page"
            @click="goPage(page)"
          >
            {{ page }}
          </button>
        </template>
        <span
          v-if="
            visiblePages.length &&
            visiblePages[visiblePages.length - 1] < pagination.total - 1
          "
          class="pagination-ellipsis"
        >
          ...
        </span>
        <button
          v-if="pagination.total > 1"
          class="pagination-button"
          :class="{ 'pagination-button-active': pagination.page === pagination.total }"
          :disabled="pagination.page === pagination.total"
          @click="goPage(pagination.total)"
        >
          {{ pagination.total }}
        </button>
        <button
          class="pagination-button"
          :disabled="pagination.page >= pagination.total"
          @click="goPage(pagination.page + 1)"
        >
          下一页
        </button>
        <div class="pagination-jump">
          <span>跳转到</span>
          <input
            v-model="jumpPageInput"
            class="pagination-input"
            type="number"
            min="1"
            :max="pagination.total"
            @keyup.enter="handleJumpPage"
          />
          <span>页</span>
          <button class="pagination-button" @click="handleJumpPage">确定</button>
        </div>
      </div>
    </div>
    <ModalEdit
      :visible="editVisible"
      :form="editForm"
      :saving="editSaving"
      @close="closeEdit"
      @submit="submitEdit"
    />
  </div>
</template>

<script setup lang="ts">
import "../../styles/markdown.css";
import { onMounted, ref, computed, watch, inject } from "vue";
import type { Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  CommentItem,
  CommentListResponse,
  fetchComments,
  deleteComment,
  updateCommentStatus,
  updateComment,
  blockIp,
  blockEmail,
  fetchDomainList,
} from "../../api/admin";
import ModalEdit from "./components/ModalEdit.vue";

const route = useRoute();
const router = useRouter();

const comments = ref<CommentItem[]>([]);
const pagination = ref<{ page: number; total: number }>({ page: 1, total: 1 });
const loading = ref(false);
const error = ref("");
const statusFilter = ref("");
const injectedDomainFilter = inject<Ref<string> | null>("domainFilter", null);
const domainFilter = injectedDomainFilter ?? ref("");
const jumpPageInput = ref("");
const editVisible = ref(false);
const editSaving = ref(false);
const editForm = ref<{
  id: number;
  name: string;
  email: string;
  url: string;
  postSlug: string;
  contentText: string;
  status: string;
  priority: number;
} | null>(null);

const filteredComments = computed(() => {
  if (!statusFilter.value) {
    return comments.value;
  }
  return comments.value.filter((item) => item.status === statusFilter.value);
});

const visiblePages = computed(() => {
  const total = pagination.value.total;
  const current = pagination.value.page;
  const maxVisible = 5;
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  let start = current - Math.floor(maxVisible / 2);
  let end = current + Math.floor(maxVisible / 2);
  if (start < 1) {
    start = 1;
    end = maxVisible;
  } else if (end > total) {
    end = total;
    start = total - maxVisible + 1;
  }
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  return pages;
});

function formatDate(value: number) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }
  return d.toLocaleString();
}

function formatStatus(status: string) {
  if (status === "approved") {
    return "已通过";
  }
  if (status === "pending") {
    return "待审核";
  }
  if (status === "rejected") {
    return "已拒绝";
  }
  return status;
}

async function loadComments(page?: number) {
  const targetPage = typeof page === "number" ? page : 1;
  loading.value = true;
  error.value = "";
  try {
    const res = await fetchComments(targetPage, domainFilter.value || undefined);
    comments.value = res.data;
    pagination.value = { page: res.pagination.page, total: res.pagination.total };
  } catch (e: any) {
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

function updateRoutePage(page: number) {
  const query: Record<string, any> = { ...route.query };
  if (page <= 1) {
    delete query.p;
  } else {
    query.p = String(page);
  }
  if (domainFilter.value) {
    query.domain = domainFilter.value;
  } else {
    delete query.domain;
  }
  router.push({ query });
}

async function goPage(page: number) {
  if (page < 1 || page > pagination.value.total) {
    return;
  }
  updateRoutePage(page);
  await loadComments(page);
}

function handleJumpPage() {
  const value = Number(jumpPageInput.value);
  if (!Number.isFinite(value)) {
    return;
  }
  const page = Math.floor(value);
  if (page < 1 || page > pagination.value.total) {
    return;
  }
  jumpPageInput.value = "";
  updateRoutePage(page);
  loadComments(page);
}

async function changeStatus(item: CommentItem, status: string) {
  try {
    await updateCommentStatus(item.id, status);
    item.status = status;
  } catch (e: any) {
    error.value = e.message || "更新状态失败";
  }
}

function handleStatusChange(item: CommentItem, event: Event) {
  const target = event.target as HTMLSelectElement;
  const status = target.value;
  if (!status || status === item.status) {
    return;
  }
  changeStatus(item, status);
}

async function removeComment(item: CommentItem) {
  if (!window.confirm(`确认删除评论 ${item.id} 吗`)) {
    return;
  }
  try {
    await deleteComment(item.id);
    comments.value = comments.value.filter((c) => c.id !== item.id);
  } catch (e: any) {
    error.value = e.message || "删除失败";
  }
}

async function handleBlockIp(item: CommentItem) {
  if (!item.ipAddress) {
    return;
  }
  if (!window.confirm(`确认将 IP ${item.ipAddress} 加入黑名单吗？`)) {
    return;
  }
  try {
    const res = await blockIp(item.ipAddress);
    window.alert(res.message || "已加入 IP 黑名单");
  } catch (e: any) {
    error.value = e.message || "屏蔽 IP 失败";
  }
}

async function handleBlockEmail(item: CommentItem) {
  if (!item.email) {
    return;
  }
  if (!window.confirm(`确认将邮箱 ${item.email} 加入黑名单吗？`)) {
    return;
  }
  try {
    const res = await blockEmail(item.email);
    window.alert(res.message || "已加入邮箱黑名单");
  } catch (e: any) {
    error.value = e.message || "屏蔽邮箱失败";
  }
}

function openEdit(item: CommentItem) {
  editForm.value = {
    id: item.id,
    name: item.name,
    email: item.email,
    url: item.url || "",
    postSlug: item.postSlug || "",
    contentText: item.contentText,
    status: item.status,
    priority:
      typeof item.priority === "number" && Number.isFinite(item.priority)
        ? item.priority
        : 1,
  };
  editVisible.value = true;
}

function closeEdit() {
  if (editSaving.value) {
    return;
  }
  editVisible.value = false;
  editForm.value = null;
}

async function submitEdit() {
  if (!editForm.value || editSaving.value) {
    return;
  }
  const current = editForm.value;
  const trimmedName = current.name.trim();
  const trimmedEmail = current.email.trim();
  const trimmedContent = current.contentText.trim();
  const trimmedUrl = current.url.trim();
  const trimmedPostSlug = current.postSlug.trim();
  const priorityValue =
    typeof current.priority === "number" && Number.isFinite(current.priority)
      ? current.priority
      : 1;
  const commentIndex = comments.value.findIndex((c) => c.id === current.id);
  const existingComment = commentIndex !== -1 ? comments.value[commentIndex] : null;
  const newPostSlug = trimmedPostSlug || existingComment?.postSlug || "";
  if (!trimmedName || !trimmedEmail || !trimmedContent) {
    error.value = "昵称、邮箱和内容不能为空";
    return;
  }
  editSaving.value = true;
  error.value = "";
  try {
    await updateComment({
      id: current.id,
      name: trimmedName,
      email: trimmedEmail,
      url: trimmedUrl || null,
      postSlug: newPostSlug,
      contentText: trimmedContent,
      status: current.status,
      priority: priorityValue,
    });
    if (commentIndex !== -1) {
      comments.value[commentIndex] = {
        ...comments.value[commentIndex],
        name: trimmedName,
        email: trimmedEmail,
        url: trimmedUrl || null,
        postSlug: newPostSlug,
        contentText: trimmedContent,
        status: current.status,
        priority: priorityValue,
      };
    }
    closeEdit();
    editVisible.value = false;
  } catch (e: any) {
    error.value = e.message || "更新评论失败";
  } finally {
    editSaving.value = false;
  }
}

onMounted(() => {
  const p = route.query.p;
  let initialPage = 1;
  if (typeof p === "string") {
    const value = Number(p);
    if (Number.isFinite(value) && value >= 1) {
      initialPage = Math.floor(value);
    }
  } else if (Array.isArray(p) && typeof p[0] === "string") {
    const value = Number(p[0]);
    if (Number.isFinite(value) && value >= 1) {
      initialPage = Math.floor(value);
    }
  }
  const d = route.query.domain;
  if (typeof d === "string" && d.trim()) {
    domainFilter.value = d.trim();
  }

  loadComments(initialPage);
});

watch(domainFilter, () => {
  updateRoutePage(1);
  loadComments(1);
});
</script>

<style scoped lang="less">
@import "../../styles/components/comments.less";
</style>
