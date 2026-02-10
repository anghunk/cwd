import { get, post, put, del } from './http';

export type AdminLoginResponse = {
	data: {
		key: string;
	};
};

export type CommentItem = {
	id: number;
	created: number;
	name: string;
	email: string;
	avatar: string;
	postSlug: string;
	postUrl: string | null;
	url: string | null;
	ipAddress: string | null;
	contentText: string;
	contentHtml: string;
	status: string;
	priority?: number;
	likes?: number;
	ua?: string | null;
	isAdmin?: boolean;
	siteId?: string;
};

export type CommentListResponse = {
	data: CommentItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
	};
};

export type AdminEmailResponse = {
	email: string | null;
};

export type CommentSettingsResponse = {
	adminEmail: string | null;
	adminBadge: string | null;
	avatarPrefix: string | null;
	adminEnabled: boolean;
	allowedDomains?: string[];
	adminKey?: string | null;
	adminKeySet?: boolean;
	requireReview?: boolean;
	blockedIps?: string[];
	blockedEmails?: string[];
};

export type EmailNotifySettingsResponse = {
	globalEnabled: boolean;
	smtp?: {
		host: string;
		port: number;
		user: string;
		pass: string;
		secure: boolean;
	};
	templates?: {
		reply?: string;
		admin?: string;
	};
};

export type CommentStatsResponse = {
	summary: {
		total: number;
		approved: number;
		pending: number;
		rejected: number;
	};
	domains: {
		domain: string;
		total: number;
		approved: number;
		pending: number;
		rejected: number;
	}[];
	last7Days: {
		date: string;
		total: number;
	}[];
};

export type VisitOverviewResponse = {
	totalPv: number;
	totalPages: number;
	todayPv: number;
	yesterdayPv?: number;
	weekPv: number;
	lastWeekPv?: number;
	monthPv: number;
	lastMonthPv?: number;
	last30Days?: {
		date: string;
		total: number;
	}[];
};

export type VisitPageItem = {
	postSlug: string;
	postTitle: string | null;
	postUrl: string | null;
	pv: number;
	lastVisitAt: number | null;
};

export type VisitPagesResponse = {
	items: VisitPageItem[];
	itemsByPv?: VisitPageItem[];
	itemsByLatest?: VisitPageItem[];
};

export type SiteListResponse = {
	sites: string[];
};

export type LikeStatsItem = {
	pageSlug: string;
	pageTitle: string | null;
	pageUrl: string | null;
	likes: number;
};

export type LikeStatsResponse = {
	items: LikeStatsItem[];
};

export type FeatureSettingsResponse = {
	enableCommentLike: boolean;
	enableArticleLike: boolean;
	enableImageLightbox: boolean;
	commentPlaceholder?: string;
	visibleDomains?: string[];
	adminLanguage?: string;
	widgetLanguage?: string;
};

export type AdminDisplaySettingsResponse = {
	layoutTitle: string | null;
};

export async function loginAdmin(name: string, password: string): Promise<string> {
	const res = await post<AdminLoginResponse>('/admin/login', { name, password });
	const key = res.data.key;
	localStorage.setItem('cwd_admin_token', key);
	return key;
}

export function logoutAdmin(): void {
	localStorage.removeItem('cwd_admin_token');
}

export function fetchComments(page: number, siteId?: string): Promise<CommentListResponse> {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(page));
	if (siteId && siteId !== 'default') {
		searchParams.set('siteId', siteId);
	}
	return get<CommentListResponse>(`/admin/comments/list?${searchParams.toString()}`);
}

export function deleteComment(id: number): Promise<{ message: string }> {
	return del<{ message: string }>(`/admin/comments/delete?id=${id}`);
}

export function updateCommentStatus(id: number, status: string): Promise<{ message: string }> {
	return put<{ message: string }>(`/admin/comments/status?id=${id}&status=${encodeURIComponent(status)}`);
}

export function updateComment(data: {
	id: number;
	name: string;
	email: string;
	url?: string | null;
	postUrl?: string | null;
	postSlug?: string;
	contentText: string;
	status?: string;
	priority?: number;
}): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/comments/update', {
		id: data.id,
		name: data.name,
		email: data.email,
		url: data.url ?? null,
		postUrl: data.postUrl ?? null,
		postSlug: data.postSlug,
		content: data.contentText,
		status: data.status,
		priority: data.priority,
	});
}

export function fetchAdminEmail(): Promise<AdminEmailResponse> {
	return get<AdminEmailResponse>('/admin/settings/email');
}

export function saveAdminEmail(email: string): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/email', { email });
}

export function fetchEmailNotifySettings(): Promise<EmailNotifySettingsResponse> {
	return get<EmailNotifySettingsResponse>('/admin/settings/email-notify');
}

export function saveEmailNotifySettings(data: {
	globalEnabled?: boolean;
	smtp?: {
		host?: string;
		port?: number;
		user?: string;
		pass?: string;
		secure?: boolean;
	};
	templates?: {
		reply?: string;
		admin?: string;
	};
}): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/email-notify', data);
}

export function sendTestEmail(data: {
	toEmail: string;
	smtp?: {
		host?: string;
		port?: number;
		user?: string;
		pass?: string;
		secure?: boolean;
	};
}): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/settings/email-test', data);
}

export function fetchCommentSettings(): Promise<CommentSettingsResponse> {
	return get<CommentSettingsResponse>('/admin/settings/comments');
}

export function saveCommentSettings(data: {
	adminEmail?: string;
	adminBadge?: string;
	avatarPrefix?: string;
	adminEnabled?: boolean;
	allowedDomains?: string[];
	adminKey?: string;
	requireReview?: boolean;
	blockedIps?: string[];
	blockedEmails?: string[];
}): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/comments', data);
}

export function blockIp(ip: string): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/comments/block-ip', { ip });
}

export function blockEmail(email: string): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/comments/block-email', { email });
}

export function exportComments(): Promise<any[]> {
	return get<any[]>('/admin/comments/export');
}

export function importComments(data: any[]): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/comments/import', data);
}

export function exportConfig(): Promise<any[]> {
	return get<any[]>('/admin/export/config');
}

export function importConfig(data: any[]): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/import/config', data);
}

export function exportStats(siteId?: string): Promise<any> {
	const searchParams = new URLSearchParams();
	if (siteId && siteId !== 'default') {
		searchParams.set('siteId', siteId);
	}
	const query = searchParams.toString();
	return get<any>(query ? `/admin/export/stats?${query}` : '/admin/export/stats');
}

export function importStats(data: any): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/import/stats', data);
}

export function exportBackup(): Promise<any> {
	return get<any>('/admin/export/backup');
}

export function importBackup(data: any): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/import/backup', data);
}

export function fetchCommentStats(siteId?: string): Promise<CommentStatsResponse> {
	const searchParams = new URLSearchParams();
	if (siteId && siteId !== 'default') {
		searchParams.set('siteId', siteId);
	}
	const query = searchParams.toString();
	const url = query ? `/admin/stats/comments?${query}` : '/admin/stats/comments';
	return get<CommentStatsResponse>(url);
}

export function fetchVisitOverview(siteId?: string): Promise<VisitOverviewResponse> {
	const searchParams = new URLSearchParams();
	if (siteId && siteId !== 'default') {
		searchParams.set('siteId', siteId);
	}
	const query = searchParams.toString();
	const url = query ? `/admin/analytics/overview?${query}` : '/admin/analytics/overview';
	return get<VisitOverviewResponse>(url);
}

export function fetchVisitPages(siteId?: string, order?: 'pv' | 'latest'): Promise<VisitPagesResponse> {
	const searchParams = new URLSearchParams();
	if (siteId && siteId !== 'default') {
		searchParams.set('siteId', siteId);
	}
	if (order) {
		searchParams.set('order', order);
	}
	const query = searchParams.toString();
	const url = query ? `/admin/analytics/pages?${query}` : '/admin/analytics/pages';
	return get<VisitPagesResponse>(url);
}

export function fetchSiteList(): Promise<SiteListResponse> {
	return get<SiteListResponse>('/admin/stats/sites');
}

export function fetchLikeStats(siteId?: string): Promise<LikeStatsResponse> {
	const searchParams = new URLSearchParams();
	if (siteId && siteId !== 'default') {
		searchParams.set('siteId', siteId);
	}
	const query = searchParams.toString();
	const url = query ? `/admin/likes/stats?${query}` : '/admin/likes/stats';
	return get<LikeStatsResponse>(url);
}

export function fetchFeatureSettings(): Promise<FeatureSettingsResponse> {
	return get<FeatureSettingsResponse>('/admin/settings/features');
}

export function saveFeatureSettings(data: { enableCommentLike?: boolean; enableArticleLike?: boolean; enableImageLightbox?: boolean; commentPlaceholder?: string; visibleDomains?: string[]; adminLanguage?: string; widgetLanguage?: string }): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/features', data);
}

export function fetchAdminDisplaySettings(): Promise<AdminDisplaySettingsResponse> {
	return get<AdminDisplaySettingsResponse>('/admin/settings/admin-display');
}

export function saveAdminDisplaySettings(data: {
	layoutTitle?: string;
}): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/admin-display', data);
}

export type TelegramSettingsResponse = {
	botToken: string | null;
	chatId: string | null;
	notifyEnabled: boolean;
};

export function fetchTelegramSettings(): Promise<TelegramSettingsResponse> {
	return get<TelegramSettingsResponse>('/admin/settings/telegram');
}

export function saveTelegramSettings(data: { botToken?: string; chatId?: string; notifyEnabled?: boolean }): Promise<{ message: string }> {
	return put<{ message: string }>('/admin/settings/telegram', data);
}

export function setupTelegramWebhook(): Promise<{ message: string; webhookUrl: string }> {
	return post<{ message: string; webhookUrl: string }>('/admin/settings/telegram/setup', {});
}

export function sendTelegramTestMessage(): Promise<{ message: string }> {
	return post<{ message: string }>('/admin/settings/telegram/test', {});
}
