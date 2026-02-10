import { Bindings } from '../bindings';

export const FEATURE_COMMENT_LIKE_KEY = 'comment_feature_comment_like';
export const FEATURE_ARTICLE_LIKE_KEY = 'comment_feature_article_like';
export const FEATURE_IMAGE_LIGHTBOX_KEY = 'comment_feature_image_lightbox';
export const FEATURE_COMMENT_PLACEHOLDER_KEY = 'comment_feature_placeholder';
export const FEATURE_VISIBLE_DOMAINS_KEY = 'admin_visible_domains';
export const FEATURE_ADMIN_LANGUAGE_KEY = 'admin_language';
export const FEATURE_WIDGET_LANGUAGE_KEY = 'widget_language';

export type FeatureSettings = {
	enableCommentLike: boolean;
	enableArticleLike: boolean;
	enableImageLightbox: boolean;
	commentPlaceholder?: string;
	visibleDomains?: string[];
	adminLanguage?: string;
	widgetLanguage?: string;
};

export async function loadFeatureSettings(env: Bindings): Promise<FeatureSettings> {
	await env.CWD_DB.prepare(
		'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
	).run();

	const keys = [
		FEATURE_COMMENT_LIKE_KEY,
		FEATURE_ARTICLE_LIKE_KEY,
		FEATURE_IMAGE_LIGHTBOX_KEY,
		FEATURE_COMMENT_PLACEHOLDER_KEY,
		FEATURE_VISIBLE_DOMAINS_KEY,
		FEATURE_ADMIN_LANGUAGE_KEY,
		FEATURE_WIDGET_LANGUAGE_KEY
	];
	const { results } = await env.CWD_DB.prepare(
		'SELECT key, value FROM Settings WHERE key IN (?, ?, ?, ?, ?, ?, ?)'
	)
		.bind(...keys)
		.all<{ key: string; value: string }>();

	const map = new Map<string, string>();
	for (const row of results) {
		if (row && row.key) {
			map.set(row.key, row.value);
		}
	}

	// Default to true if not set, or false?
	// Usually features might be enabled by default.
	// But let's check the user requirement. "New settings... whether to enable..."
	// If I default to false, existing users might lose features if they were implicit.
	// But these are "new" settings.
	// "comment likes" and "article likes" existed before?
	// The code shows `like.ts` and `likeComment.ts`.
	// `likePage` handler in `index.ts`.
	// So the features exist. To avoid breaking changes, I should probably default to TRUE.
	// But wait, if I default to true, then the user has to manually turn them off.
	// If I default to false, they disappear.
	// Given "whether to enable" implies they might be optional now.
	// I'll default to TRUE to maintain backward compatibility (features visible by default).

	const enableCommentLikeRaw = map.get(FEATURE_COMMENT_LIKE_KEY);
	const enableCommentLike = enableCommentLikeRaw !== '0'; // Default to true if missing or '1'

	const enableArticleLikeRaw = map.get(FEATURE_ARTICLE_LIKE_KEY);
	const enableArticleLike = enableArticleLikeRaw !== '0'; // Default to true if missing or '1'

	const enableImageLightboxRaw = map.get(FEATURE_IMAGE_LIGHTBOX_KEY);
	const enableImageLightbox = enableImageLightboxRaw === '1';

	const commentPlaceholder = map.get(FEATURE_COMMENT_PLACEHOLDER_KEY);
	const adminLanguage = map.get(FEATURE_ADMIN_LANGUAGE_KEY);
	const widgetLanguage = map.get(FEATURE_WIDGET_LANGUAGE_KEY);

	let visibleDomains: string[] | undefined;
	const visibleDomainsRaw = map.get(FEATURE_VISIBLE_DOMAINS_KEY);
	if (visibleDomainsRaw) {
		try {
			visibleDomains = JSON.parse(visibleDomainsRaw);
		} catch (e) {
			// ignore error
		}
	}

	return {
		enableCommentLike,
		enableArticleLike,
		enableImageLightbox,
		commentPlaceholder,
		visibleDomains,
		adminLanguage,
		widgetLanguage
	};
}

export async function saveFeatureSettings(
	env: Bindings,
	settings: Partial<FeatureSettings>
) {
	await env.CWD_DB.prepare(
		'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
	).run();

	const entries: { key: string; value: string | undefined }[] = [
		{
			key: FEATURE_COMMENT_LIKE_KEY,
			value:
				typeof settings.enableCommentLike === 'boolean'
					? settings.enableCommentLike
						? '1'
						: '0'
					: undefined
		},
		{
			key: FEATURE_ARTICLE_LIKE_KEY,
			value:
				typeof settings.enableArticleLike === 'boolean'
					? settings.enableArticleLike
						? '1'
						: '0'
					: undefined
		},
		{
			key: FEATURE_IMAGE_LIGHTBOX_KEY,
			value:
				typeof settings.enableImageLightbox === 'boolean'
					? settings.enableImageLightbox
						? '1'
						: '0'
					: undefined
		},
		{
			key: FEATURE_COMMENT_PLACEHOLDER_KEY,
			value: settings.commentPlaceholder
		},
		{
			key: FEATURE_VISIBLE_DOMAINS_KEY,
			value: settings.visibleDomains ? JSON.stringify(settings.visibleDomains) : undefined
		},
		{
			key: FEATURE_ADMIN_LANGUAGE_KEY,
			value: settings.adminLanguage
		},
		{
			key: FEATURE_WIDGET_LANGUAGE_KEY,
			value: settings.widgetLanguage
		}
	];

	for (const entry of entries) {
		if (entry.value !== undefined) {
			await env.CWD_DB.prepare('REPLACE INTO Settings (key, value) VALUES (?, ?)')
				.bind(entry.key, entry.value)
				.run();
		}
	}
}
