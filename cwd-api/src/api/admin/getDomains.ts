import type { Context } from 'hono';
import type { Bindings } from '../../bindings';

export const getSites = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const sites = new Set<string>();

		// 1. Get sites from Comment
		const { results: commentRows } = await c.env.CWD_DB.prepare(
			'SELECT DISTINCT site_id FROM Comment'
		).all<{ site_id: string }>();

		for (const row of commentRows) {
			if (row.site_id !== undefined && row.site_id !== null) {
				sites.add(row.site_id);
			}
		}

		// 2. Get sites from page_stats
		const { results: pageRows } = await c.env.CWD_DB.prepare(
			'SELECT DISTINCT site_id FROM page_stats'
		).all<{ site_id: string }>();

		for (const row of pageRows) {
			if (row.site_id !== undefined && row.site_id !== null) {
				sites.add(row.site_id);
			}
		}

        // 3. Get sites from page_visit_daily
        const { results: dailyRows } = await c.env.CWD_DB.prepare(
            'SELECT DISTINCT site_id FROM page_visit_daily'
        ).all<{ site_id: string }>();

        for (const row of dailyRows) {
            if (row.site_id !== undefined && row.site_id !== null) {
                sites.add(row.site_id);
            }
        }

		const list = Array.from(sites);
		list.sort();

		return c.json({
			sites: list
		});
	} catch (e: any) {
		return c.json(
			{ message: e.message || '获取站点列表失败' },
			500
		);
	}
};
