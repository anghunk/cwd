import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const getStatsData = async (env: Bindings, siteId?: string) => {
	// Tables are ensured by dbMigration on startup

	let statsQuery = 'SELECT * FROM page_stats';
	let dailyQuery = 'SELECT * FROM page_visit_daily';
	let likesQuery = 'SELECT * FROM Likes';
	const params: any[] = [];

	if (siteId) {
		statsQuery += ' WHERE site_id = ?';
		dailyQuery += ' WHERE site_id = ?';
		likesQuery += ' WHERE site_id = ?';
		params.push(siteId);
	}

	const { results: pageStats } = await env.CWD_DB.prepare(statsQuery).bind(...params).all();
	const { results: dailyVisits } = await env.CWD_DB.prepare(dailyQuery).bind(...params).all();
	const { results: likes } = await env.CWD_DB.prepare(likesQuery).bind(...params).all();

	return {
		page_stats: pageStats,
		page_visit_daily: dailyVisits,
		likes: likes
	};
};

export const exportStats = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const siteId = c.req.query('siteId');
		const data = await getStatsData(c.env, siteId);
		return c.json(data);
	} catch (e: any) {
		return c.json({ message: e.message || '导出统计数据失败' }, 500);
	}
};
