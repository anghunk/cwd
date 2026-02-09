import { Context } from 'hono';
import { Bindings } from '../../bindings';

type StatusCounts = {
	total: number;
	approved: number;
	pending: number;
	rejected: number;
};

type DomainCounts = StatusCounts & {
	domain: string;
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

export const getStats = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const rawSiteId = c.req.query('siteId');
		const siteId = rawSiteId && rawSiteId !== 'default' ? rawSiteId : null;

		let sql = 'SELECT created, post_slug, post_url, status FROM Comment';
		const params: any[] = [];

		if (siteId) {
			sql += ' WHERE site_id = ?';
			params.push(siteId);
		}

		const { results } = await c.env.CWD_DB.prepare(sql).bind(...params).all<{
			created: number;
			post_slug: string;
			post_url: string | null;
			status: string;
		}>();

		const summary: StatusCounts = {
			total: 0,
			approved: 0,
			pending: 0,
			rejected: 0
		};

		const domainMap = new Map<string, StatusCounts>();
		const dailyMap = new Map<string, number>();

		const now = Date.now();
		const thirtyDaysAgo = now - 29 * 24 * 60 * 60 * 1000;

		for (const row of results) {
			const domain =
				extractDomain(row.post_url) || extractDomain(row.post_slug) || 'unknown';

			let counts = domainMap.get(domain);
			if (!counts) {
				counts = {
					total: 0,
					approved: 0,
					pending: 0,
					rejected: 0
				};
				domainMap.set(domain, counts);
			}
			counts.total += 1;
			if (row.status === 'approved') {
				counts.approved += 1;
			} else if (row.status === 'pending') {
				counts.pending += 1;
			} else if (row.status === 'rejected') {
				counts.rejected += 1;
			}

			summary.total += 1;
			if (row.status === 'approved') {
				summary.approved += 1;
			} else if (row.status === 'pending') {
				summary.pending += 1;
			} else if (row.status === 'rejected') {
				summary.rejected += 1;
			}

			if (row.created >= thirtyDaysAgo) {
				const d = new Date(row.created);
				const year = d.getUTCFullYear();
				const month = String(d.getUTCMonth() + 1).padStart(2, '0');
				const day = String(d.getUTCDate()).padStart(2, '0');
				const key = `${year}-${month}-${day}`;

				dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
			}
		}

		const domains: DomainCounts[] = Array.from(domainMap.entries())
			.map(([domain, counts]) => ({
				domain,
				total: counts.total,
				approved: counts.approved,
				pending: counts.pending,
				rejected: counts.rejected
			}))
			.sort((a, b) => b.total - a.total);

		const last7Days: { date: string; total: number }[] = [];
		for (let i = 29; i >= 0; i--) {
			const d = new Date(now - i * 24 * 60 * 60 * 1000);
			const year = d.getUTCFullYear();
			const month = String(d.getUTCMonth() + 1).padStart(2, '0');
			const day = String(d.getUTCDate()).padStart(2, '0');
			const key = `${year}-${month}-${day}`;
			last7Days.push({
				date: key,
				total: dailyMap.get(key) || 0
			});
		}

		return c.json({
			summary,
			domains,
			last7Days
		});
	} catch (e: any) {
		return c.json({ message: e.message || '获取统计数据失败' }, 500);
	}
};
