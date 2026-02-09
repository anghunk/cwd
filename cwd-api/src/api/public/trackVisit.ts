import type { Context } from 'hono';
import type { Bindings } from '../../bindings';

type TrackVisitBody = {
	postSlug?: string;
	postTitle?: string;
	postUrl?: string;
	siteId?: string;
};

function extractDomain(source: string | null | undefined): string | null {
	if (!source) {
		return null;
	}
	const value = source.trim();
	if (!value) {
		return null;
	}
	if (!/^https?:\/\//i.test(value)) {
		return null;
	}
	try {
		const url = new URL(value);
		return url.hostname.toLowerCase();
	} catch {
		return null;
	}
}

export const trackVisit = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const body = (await c.req.json().catch(() => ({}))) as TrackVisitBody;

		const rawPostSlug = typeof body.postSlug === 'string' ? body.postSlug.trim() : '';
		const rawPostTitle = typeof body.postTitle === 'string' ? body.postTitle.trim() : '';
		const rawPostUrl = typeof body.postUrl === 'string' ? body.postUrl.trim() : '';
		const rawSiteId = typeof body.siteId === 'string' ? body.siteId.trim() : '';

		if (!rawPostSlug) {
			return c.json({ message: 'postSlug is required' }, 400);
		}

		const nowDate = new Date();
		const nowTs = nowDate.getTime();
		const nowIso = nowDate.toISOString();
		const today = nowIso.slice(0, 10);

		const domain =
			extractDomain(rawPostUrl) ||
			extractDomain(rawPostSlug) ||
			null;

		// Upsert page_stats using ON CONFLICT (site_id, post_slug)
		await c.env.CWD_DB.prepare(
			`INSERT INTO page_stats (site_id, post_slug, post_title, post_url, pv, last_visit_at, created_at, updated_at) 
			 VALUES (?, ?, ?, ?, 1, ?, ?, ?)
			 ON CONFLICT(site_id, post_slug) DO UPDATE SET 
			 pv = pv + 1, 
			 last_visit_at = ?, 
			 updated_at = ?, 
			 post_title = excluded.post_title, 
			 post_url = excluded.post_url`
		)
			.bind(
				rawSiteId,
				rawPostSlug,
				rawPostTitle || null,
				rawPostUrl || null,
				nowTs,
				nowTs,
				nowTs,
				nowTs,
				nowTs
			)
			.run();

		// Update page_visit_daily
		// We try to find a row for (date, site_id, domain)
		let dailySql = 'SELECT id, count FROM page_visit_daily WHERE date = ? AND site_id = ?';
		const params: any[] = [today, rawSiteId];

		if (domain) {
			dailySql += ' AND domain = ?';
			params.push(domain);
		} else {
			dailySql += ' AND domain IS NULL';
		}

		const dailyRow = await c.env.CWD_DB.prepare(dailySql)
			.bind(...params)
			.first<{ id: number; count: number }>();

		if (!dailyRow) {
			await c.env.CWD_DB.prepare(
				'INSERT INTO page_visit_daily (date, site_id, domain, count, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
			)
				.bind(today, rawSiteId, domain, nowTs, nowTs)
				.run();
		} else {
			const newCount = (dailyRow.count || 0) + 1;
			await c.env.CWD_DB.prepare(
				'UPDATE page_visit_daily SET count = ?, updated_at = ? WHERE id = ?'
			)
				.bind(newCount, nowTs, dailyRow.id)
				.run();
		}

		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ message: e.message || '记录访问数据失败' }, 500);
	}
};
