import type { Context } from 'hono';
import type { Bindings } from '../../bindings';

type LikeStatsItem = {
	page_slug: string;
	page_title: string | null;
	page_url: string | null;
	likes: number;
};

export const getLikeStats = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const siteId = c.req.query('siteId');

		let query = `
			SELECT l.page_slug, COALESCE(p.post_title, NULL) AS page_title, COALESCE(p.post_url, NULL) AS page_url, COUNT(*) AS likes 
			FROM Likes l 
			LEFT JOIN page_stats p ON p.post_slug = l.page_slug AND p.site_id = l.site_id
		`;
		
		const params: any[] = [];

		if (siteId) {
			query += ' WHERE l.site_id = ?';
			params.push(siteId);
		}

		query += ' GROUP BY l.page_slug, l.site_id, p.post_title, p.post_url ORDER BY likes DESC LIMIT 50';

		const { results } = await c.env.CWD_DB.prepare(query).bind(...params).all<LikeStatsItem>();

		const items = results.map((row) => ({
			pageSlug: row.page_slug,
			pageTitle: row.page_title,
			pageUrl: row.page_url,
			likes: row.likes
		}));

		return c.json({ items });
	} catch (e: any) {
		return c.json({ message: e.message || '获取点赞统计失败' }, 500);
	}
};

