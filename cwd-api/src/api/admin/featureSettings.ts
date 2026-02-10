import { Context } from 'hono';
import { Bindings } from '../../bindings';
import {
	loadFeatureSettings,
	saveFeatureSettings
} from '../../utils/featureSettings';

export const getFeatureSettings = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const settings = await loadFeatureSettings(c.env);
		return c.json(settings);
	} catch (e: any) {
		return c.json({ message: e.message || 'Failed to load feature settings' }, 500);
	}
};

export const updateFeatureSettings = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const body = await c.req.json();
		const enableCommentLike =
			typeof body.enableCommentLike === 'boolean'
				? body.enableCommentLike
				: undefined;
		const enableArticleLike =
			typeof body.enableArticleLike === 'boolean'
				? body.enableArticleLike
				: undefined;
		const enableImageLightbox =
			typeof body.enableImageLightbox === 'boolean'
				? body.enableImageLightbox
				: undefined;
		const rawCommentPlaceholder =
			typeof body.commentPlaceholder === 'string' ? body.commentPlaceholder : undefined;
		const commentPlaceholder =
			rawCommentPlaceholder !== undefined ? rawCommentPlaceholder.trim() : undefined;

		const visibleDomains = Array.isArray(body.visibleDomains)
			? (body.visibleDomains as string[])
			: undefined;
		
		const adminLanguage = typeof body.adminLanguage === 'string' ? body.adminLanguage : undefined;
		const widgetLanguage = typeof body.widgetLanguage === 'string' ? body.widgetLanguage : undefined;

		await saveFeatureSettings(c.env, {
			enableCommentLike,
			enableArticleLike,
			enableImageLightbox,
			commentPlaceholder,
			visibleDomains,
			adminLanguage,
			widgetLanguage
		});

		return c.json({ message: '保存成功！' });
	} catch (e: any) {
		return c.json({ message: e.message || 'Failed to save feature settings' }, 500);
	}
};
