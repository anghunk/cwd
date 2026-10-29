<template>
	<div class="page">
		<div class="page-header">
			<div class="page-heading">
				<h2 class="page-title">{{ t('comments.title') }}</h2>
				<p class="page-description">{{ t('ui.commentsDescription') }}</p>
			</div>
			<div class="toolbar">
				<div class="toolbar-left">
					<select v-model="statusFilter" class="toolbar-select" :aria-label="t('comments.table.status')">
						<option value="">{{ t('comments.statusFilter.all') }}</option>
						<option value="approved">{{ t('comments.statusFilter.approved') }}</option>
						<option value="pending">{{ t('comments.statusFilter.pending') }}</option>
						<option value="rejected">{{ t('comments.statusFilter.rejected') }}</option>
					</select>
				</div>
				<div class="toolbar-right">
					<button class="toolbar-button" :disabled="loading" @click="goPage(1)">
						<PhArrowClockwise :size="15" :class="{ 'is-refreshing': loading }" />
						{{ t('comments.refresh') }}
					</button>
				</div>
			</div>
		</div>
		<div v-if="loading" class="page-hint">{{ t('common.loading') }}</div>
		<div v-else-if="error" class="page-error">{{ error }}</div>
		<div v-else class="comments-results">
			<div class="comment-table-scroll" role="region" :aria-label="t('comments.title')" tabindex="0">
				<table v-if="filteredComments.length" class="comment-table">
					<colgroup>
						<col class="comment-column-author" />
						<col />
						<col class="comment-column-status" />
						<col class="comment-column-actions" />
					</colgroup>
					<thead>
						<tr>
							<th scope="col">{{ t('comments.table.author') }}</th>
							<th scope="col">{{ t('comments.table.content') }}</th>
							<th scope="col">{{ t('comments.table.status') }}</th>
							<th scope="col">{{ t('comments.table.actions') }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in filteredComments" :key="item.id" class="comment-row">
							<td class="comment-author-cell">
								<div class="cell-author-wrapper">
									<img v-if="item.avatar" :src="item.avatar" class="cell-avatar" :alt="item.name" />
									<div v-else class="cell-avatar cell-avatar-fallback" aria-hidden="true">{{ item.name.slice(0, 1).toUpperCase() }}</div>
									<div class="cell-author-main">
										<div class="cell-author-name">
											<span class="cell-author-name-text" :title="item.name">{{ item.name }}</span>
											<span v-if="item.isAdmin" class="cell-admin-tag">
												<svg viewBox="0 0 22 22" :aria-label="t('comments.table.admin')" role="img" class="cwd-admin-icon">
													<g>
														<path
															d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path>
													</g>
												</svg>
											</span>
										</div>
										<button
											v-if="item.email"
											type="button"
											class="cell-email-text"
											:title="`${item.email} · ${t('comments.actions.blockEmail')}`"
											@click="handleBlockEmail(item)">
											{{ item.email }}
										</button>
										<time class="cell-time">{{ formatDate(item.created) }}</time>
										<button
											v-if="item.ipAddress"
											type="button"
											class="cell-ip-text"
											:title="t('comments.actions.blockIp')"
											@click="handleBlockIp(item)">
											{{ item.ipAddress }}
										</button>
									</div>
								</div>
							</td>
							<td class="comment-content-cell">
								<div class="cell-content-text" v-html="item.contentHtml"></div>
								<a
									v-if="item.postUrl || item.postSlug"
									:href="item.postUrl ?? undefined"
									target="_blank"
									rel="noopener noreferrer"
									class="cell-path"
									:title="item.postUrl || item.postSlug"
									>{{ item.postUrl || item.postSlug }}</a
								>
							</td>
							<td>
								<div class="cell-status-wrapper">
									<span class="cell-status" :class="`cell-status-${item.status}`">{{ formatStatus(item.status) }}</span>
									<span v-if="item.priority && item.priority > 1" :title="String(item.priority)" class="cell-pin-flag">{{
										t('comments.actions.pin')
									}}</span>
									<span v-if="item.likes !== 0" class="cell-likes-number">
										<PhThumbsUp :size="12" aria-hidden="true" />
										{{ typeof item.likes === 'number' && Number.isFinite(item.likes) && item.likes >= 0 ? item.likes : 0 }}
									</span>
								</div>
							</td>
							<td>
								<div class="comment-actions">
									<select
										class="status-select"
										:aria-label="t('comments.editModal.status')"
										:title="formatStatus(item.status)"
										:value="item.status"
										@change="handleStatusChange(item, $event)">
										<option value="approved">{{ t('comments.actions.approve') }}</option>
										<option value="pending">{{ t('comments.actions.pending') }}</option>
										<option value="rejected">{{ t('comments.actions.reject') }}</option>
									</select>
									<button class="comment-action" @click="openEdit(item)">{{ t('comments.actions.edit') }}</button>
									<button class="comment-action comment-action-danger" @click="removeComment(item)">
										{{ t('comments.actions.delete') }}
									</button>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
				<div v-else class="comments-empty">
					<PhChatCircleDots :size="32" weight="light" aria-hidden="true" />
					{{ t('comments.empty') }}
				</div>
			</div>
			<div v-if="pagination.total > 1" class="pagination">
				<button class="pagination-button" :disabled="pagination.page <= 1" @click="goPage(pagination.page - 1)">
					{{ t('comments.pagination.prev') }}
				</button>
				<button
					class="pagination-button"
					:class="{ 'pagination-button-active': pagination.page === 1 }"
					:disabled="pagination.page === 1"
					@click="goPage(1)">
					1
				</button>
				<span v-if="visiblePages.length && visiblePages[0] > 2" class="pagination-ellipsis"> ... </span>
				<template v-for="page in visiblePages">
					<button
						v-if="page !== 1 && page !== pagination.total"
						:key="page"
						class="pagination-button"
						:class="{ 'pagination-button-active': page === pagination.page }"
						:disabled="page === pagination.page"
						@click="goPage(page)">
						{{ page }}
					</button>
				</template>
				<span v-if="visiblePages.length && visiblePages[visiblePages.length - 1] < pagination.total - 1" class="pagination-ellipsis">
					...
				</span>
				<button
					v-if="pagination.total > 1"
					class="pagination-button"
					:class="{ 'pagination-button-active': pagination.page === pagination.total }"
					:disabled="pagination.page === pagination.total"
					@click="goPage(pagination.total)">
					{{ pagination.total }}
				</button>
				<button class="pagination-button" :disabled="pagination.page >= pagination.total" @click="goPage(pagination.page + 1)">
					{{ t('comments.pagination.next') }}
				</button>
				<div class="pagination-jump">
					<span>{{ t('comments.pagination.jumpTo') }}</span>
					<input
						v-model="jumpPageInput"
						class="pagination-input"
						type="number"
						min="1"
						:max="pagination.total"
						@keyup.enter="handleJumpPage" />
					<span>{{ t('comments.pagination.page') }}</span>
					<button class="pagination-button" @click="handleJumpPage">
						{{ t('comments.pagination.confirm') }}
					</button>
				</div>
			</div>
		</div>
		<ModalEdit :visible="editVisible" :form="editForm" :saving="editSaving" @close="closeEdit" @submit="submitEdit" />
	</div>
</template>

<script setup lang="ts">
import '../../styles/markdown.css';
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ModalEdit from './components/ModalEdit.vue';
import { CommentItem, fetchComments, deleteComment, updateCommentStatus, updateComment, blockIp, blockEmail } from '../../api/admin';
import { useSite } from '../../composables/useSite';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// ... existing refs ...
const comments = ref<CommentItem[]>([]);
const pagination = ref<{ page: number; total: number }>({ page: 1, total: 1 });
const loading = ref(false);
const error = ref('');
const statusFilter = ref('');
const { currentSiteId } = useSite();
const jumpPageInput = ref('');
const editVisible = ref(false);
const editSaving = ref(false);
const editForm = ref<{
	id: number;
	name: string;
	email: string;
	url: string;
	postSlug: string;
	postUrl: string;
	contentText: string;
	status: string;
	priority: number;
} | null>(null);

const searchKeyword = ref(''); // Missing ref in original code snippet but used in template?
// Wait, I saw searchKeyword in original code snippet. I must ensure I don't lose it.
// I will just use the replace string for the specific parts if possible, but I am replacing whole template.
// I need to be careful with script content.

const filteredComments = computed(() => {
	if (!statusFilter.value) {
		return comments.value;
	}
	return comments.value.filter((item) => item.status === statusFilter.value);
});

// ... visiblePages computed ...
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
	if (status === 'approved') {
		return t('comments.statusFilter.approved');
	}
	if (status === 'pending') {
		return t('comments.statusFilter.pending');
	}
	if (status === 'rejected') {
		return t('comments.statusFilter.rejected');
	}
	return status;
}

// ... other functions ...
async function loadComments(page?: number) {
	const targetPage = typeof page === 'number' ? page : 1;
	loading.value = true;
	error.value = '';
	try {
		const res = await fetchComments(targetPage, currentSiteId.value);
		comments.value = res.data;
		pagination.value = { page: res.pagination.page, total: res.pagination.total };
	} catch (e: any) {
		error.value = e.message || '加载失败';
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
	delete query.domain;
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
	jumpPageInput.value = '';
	updateRoutePage(page);
	loadComments(page);
}

async function changeStatus(item: CommentItem, status: string) {
	try {
		await updateCommentStatus(item.id, status);
		item.status = status;
	} catch (e: any) {
		error.value = e.message || '更新状态失败';
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
	if (!window.confirm(t('comments.confirmDelete', { id: item.id }))) {
		return;
	}
	try {
		await deleteComment(item.id);
		comments.value = comments.value.filter((c) => c.id !== item.id);
	} catch (e: any) {
		error.value = e.message || '删除失败';
	}
}

async function handleBlockIp(item: CommentItem) {
	if (!item.ipAddress) {
		return;
	}
	if (!window.confirm(t('comments.confirmBlockIp', { ip: item.ipAddress }))) {
		return;
	}
	try {
		const res = await blockIp(item.ipAddress);
		window.alert(res.message || t('comments.successBlockIp'));
	} catch (e: any) {
		error.value = e.message || '屏蔽 IP 失败';
	}
}

async function handleBlockEmail(item: CommentItem) {
	if (!item.email) {
		return;
	}
	if (!window.confirm(t('comments.confirmBlockEmail', { email: item.email }))) {
		return;
	}
	try {
		const res = await blockEmail(item.email);
		window.alert(res.message || t('comments.successBlockEmail'));
	} catch (e: any) {
		error.value = e.message || '屏蔽邮箱失败';
	}
}

function openEdit(item: CommentItem) {
	editForm.value = {
		id: item.id,
		name: item.name,
		email: item.email,
		url: item.url || '',
		postSlug: item.postSlug || '',
		postUrl: item.postUrl || '',
		contentText: item.contentText,
		status: item.status,
		priority: typeof item.priority === 'number' && Number.isFinite(item.priority) ? item.priority : 1,
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
	const trimmedPostUrl = current.postUrl.trim();
	const priorityValue = typeof current.priority === 'number' && Number.isFinite(current.priority) ? current.priority : 1;
	const commentIndex = comments.value.findIndex((c) => c.id === current.id);
	const existingComment = commentIndex !== -1 ? comments.value[commentIndex] : null;
	const newPostSlug = trimmedPostSlug || existingComment?.postSlug || '';
	if (!trimmedName || !trimmedEmail || !trimmedContent) {
		error.value = '昵称、邮箱和内容不能为空';
		return;
	}
	editSaving.value = true;
	error.value = '';
	try {
		await updateComment({
			id: current.id,
			name: trimmedName,
			email: trimmedEmail,
			url: trimmedUrl || null,
			postUrl: trimmedPostUrl,
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
				postUrl: trimmedPostUrl,
				contentText: trimmedContent,
				status: current.status,
				priority: priorityValue,
			};
		}
		closeEdit();
		editVisible.value = false;
	} catch (e: any) {
		error.value = e.message || '更新评论失败';
	} finally {
		editSaving.value = false;
	}
}

onMounted(() => {
	const p = route.query.p;
	let initialPage = 1;
	if (typeof p === 'string') {
		const value = Number(p);
		if (Number.isFinite(value) && value >= 1) {
			initialPage = Math.floor(value);
		}
	} else if (Array.isArray(p) && typeof p[0] === 'string') {
		const value = Number(p[0]);
		if (Number.isFinite(value) && value >= 1) {
			initialPage = Math.floor(value);
		}
	}

	loadComments(initialPage);
});

watch(currentSiteId, () => {
	updateRoutePage(1);
	loadComments(1);
});
</script>

<style scoped lang="less">
@import '../../styles/components/comments.less';
</style>
