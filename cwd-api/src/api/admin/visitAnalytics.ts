import type { Context } from 'hono';
import type { Bindings } from '../../bindings';

type VisitOverview = {
	totalPv: number;
	totalPages: number;
	todayPv: number;
	yesterdayPv: number;
	weekPv: number;
	lastWeekPv: number;
	monthPv: number;
	lastMonthPv: number;
	last30Days: {
		date: string;
		total: number;
	}[];
};

type VisitPageItem = {
	postSlug: string;
	postTitle: string | null;
	postUrl: string | null;
	pv: number;
	lastVisitAt: string | null;
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

export const getVisitOverview = async (
	c: Context<{ Bindings: Bindings }>
) => {
	try {
		const rawDomain = c.req.query('domain') || '';
		const domainFilter = rawDomain.trim().toLowerCase();

		await c.env.CWD_DB.prepare(
			'CREATE TABLE IF NOT EXISTS page_stats (id INTEGER PRIMARY KEY AUTOINCREMENT, post_slug TEXT UNIQUE NOT NULL, post_title TEXT, post_url TEXT, pv INTEGER NOT NULL DEFAULT 0, last_visit_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)'
		).run();

		await c.env.CWD_DB.prepare(
			'CREATE TABLE IF NOT EXISTS page_visit_daily (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, domain TEXT, count INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)'
		).run();

		const { results } = await c.env.CWD_DB.prepare(
			'SELECT post_slug, post_title, post_url, pv, last_visit_at FROM page_stats'
		).all<{
			post_slug: string;
			post_title: string | null;
			post_url: string | null;
			pv: number;
			last_visit_at: number | null;
		}>();

		let totalPv = 0;
		let totalPages = 0;

		for (const row of results) {
			const domain =
				extractDomain(row.post_url) ||
				extractDomain(row.post_slug) ||
				null;

			if (domainFilter && domain !== domainFilter) {
				continue;
			}

			totalPv += row.pv || 0;
			totalPages += 1;
		}

		const now = new Date();
		const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

		const year = now.getUTCFullYear();
		const month = now.getUTCMonth();
		const day = now.getUTCDate();

		const toKey = (d: Date) => {
			const y = d.getUTCFullYear();
			const m = String(d.getUTCMonth() + 1).padStart(2, '0');
			const dd = String(d.getUTCDate()).padStart(2, '0');
			return `${y}-${m}-${dd}`;
		};

		const startDate30 = toKey(thirtyDaysAgo);

		const monthStartDate = new Date(Date.UTC(year, month, 1));
		const monthStartKey = toKey(monthStartDate);

		// Calculate date ranges for last month and last week queries
		const lastMonthStartDate = new Date(Date.UTC(year, month - 1, 1));
		const lastMonthEndDate = new Date(monthStartDate.getTime() - 24 * 60 * 60 * 1000);

		// For last week, we need the start date of last week.
		// weekStartDate is the start of current week.
		// So lastWeekStartDate is weekStartDate - 7 days.
		const weekStartDate = (() => {
			const d = new Date(Date.UTC(year, month, day));
			const weekday = d.getUTCDay();
			const offset = (weekday + 6) % 7;
			return new Date(d.getTime() - offset * 24 * 60 * 60 * 1000);
		})();

		const lastWeekStartDate = new Date(weekStartDate.getTime() - 7 * 24 * 60 * 60 * 1000);
		const lastWeekEndDate = new Date(weekStartDate.getTime() - 24 * 60 * 60 * 1000);

		// We need to fetch enough history for last month.
		// The earliest date could be either startDate30 or lastMonthStartDate.
		let earliestDate = startDate30;
		if (toKey(lastMonthStartDate) < earliestDate) {
			earliestDate = toKey(lastMonthStartDate);
		}
		if (toKey(lastWeekStartDate) < earliestDate) {
			earliestDate = toKey(lastWeekStartDate);
		}

		let dailySql =
			'SELECT date, domain, count FROM page_visit_daily WHERE date >= ?';
		const params: string[] = [earliestDate];

		if (domainFilter) {
			dailySql += ' AND domain = ?';
			params.push(domainFilter);
		}

		const { results: dailyRows } = await c.env.CWD_DB.prepare(dailySql)
			.bind(...params)
			.all<{
				date: string;
				domain: string | null;
				count: number;
			}>();

		const dailyMap = new Map<string, number>();

		for (const row of dailyRows) {
			if (!row || !row.date) {
				continue;
			}
			const key = row.date;
			const value = row.count || 0;
			dailyMap.set(key, (dailyMap.get(key) || 0) + value);
		}

		if (dailyMap.size === 0 && totalPv > 0) {
			const fallbackDate = now.toISOString().slice(0, 10);
			dailyMap.set(fallbackDate, totalPv);
		}

		const todayKey = toKey(now);
		const yesterdayKey = toKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));

		// weekStartDate is already calculated above
		const weekStartKey = toKey(weekStartDate);

		let todayPv = dailyMap.get(todayKey) || 0;
		let yesterdayPv = dailyMap.get(yesterdayKey) || 0;
		let weekPv = 0;
		let lastWeekPv = 0;
		let monthPv = 0;
		let lastMonthPv = 0;

		// Calculate Week PV
		{
			let cursor = new Date(weekStartDate.getTime());
			while (cursor.getTime() <= now.getTime()) {
				const key = toKey(cursor);
				weekPv += dailyMap.get(key) || 0;
				cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
			}
		}

		// Calculate Last Week PV
		{
			let cursor = new Date(lastWeekStartDate.getTime());
			while (cursor.getTime() <= lastWeekEndDate.getTime()) {
				const key = toKey(cursor);
				lastWeekPv += dailyMap.get(key) || 0;
				cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
			}
		}

		// Calculate Month PV
		{
			let cursor = new Date(monthStartDate.getTime());
			while (cursor.getTime() <= now.getTime()) {
				const key = toKey(cursor);
				monthPv += dailyMap.get(key) || 0;
				cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
			}
		}

		// Calculate Last Month PV
		{
			let cursor = new Date(lastMonthStartDate.getTime());
			while (cursor.getTime() <= lastMonthEndDate.getTime()) {
				const key = toKey(cursor);
				lastMonthPv += dailyMap.get(key) || 0;
				cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
			}
		}

		if (todayPv > totalPv) {
			todayPv = totalPv;
		}
		if (weekPv > totalPv) {
			weekPv = totalPv;
		}
		if (monthPv > totalPv) {
			monthPv = totalPv;
		}

		const last30Days: { date: string; total: number }[] = [];
		for (let i = 29; i >= 0; i--) {
			const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const key = toKey(d);
			last30Days.push({
				date: key,
				total: dailyMap.get(key) || 0
			});
		}

		const data: VisitOverview = {
			totalPv,
			totalPages,
			todayPv,
			yesterdayPv,
			weekPv,
			lastWeekPv,
			monthPv,
			lastMonthPv,
			last30Days
		};

		return c.json(data);
	} catch (e: any) {
		return c.json(
			{ message: e.message || '获取访问统计概览失败' },
			500
		);
	}
};

export const getVisitPages = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const rawDomain = c.req.query('domain') || '';
		const domainFilter = rawDomain.trim().toLowerCase();
		const rawOrder = c.req.query('order') || '';
		const order = rawOrder.trim().toLowerCase();
		const isLatest = order === 'latest';

		await c.env.CWD_DB.prepare(
			'CREATE TABLE IF NOT EXISTS page_stats (id INTEGER PRIMARY KEY AUTOINCREMENT, post_slug TEXT UNIQUE NOT NULL, post_title TEXT, post_url TEXT, pv INTEGER NOT NULL DEFAULT 0, last_visit_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)'
		).run();

		let sql =
			'SELECT post_slug, post_title, post_url, pv, last_visit_at FROM page_stats ORDER BY pv DESC, last_visit_at DESC';

		if (isLatest) {
			sql =
				'SELECT post_slug, post_title, post_url, pv, last_visit_at FROM page_stats ORDER BY last_visit_at DESC, pv DESC';
		}

		const { results } = await c.env.CWD_DB.prepare(sql).all<{
			post_slug: string;
			post_title: string | null;
			post_url: string | null;
			pv: number;
			last_visit_at: number | null;
		}>();

		let items: VisitPageItem[] = [];

		for (const row of results) {
			const domain =
				extractDomain(row.post_url) ||
				extractDomain(row.post_slug) ||
				null;

			if (domainFilter && domain !== domainFilter) {
				continue;
			}

			items.push({
				postSlug: row.post_slug,
				postTitle: row.post_title,
				postUrl: row.post_url,
				pv: row.pv || 0,
				lastVisitAt: row.last_visit_at
			});
		}

		items = items.slice(0, 20);

		return c.json({ items });
	} catch (e: any) {
		return c.json(
			{ message: e.message || '获取页面访问统计失败' },
			500
		);
	}
};
