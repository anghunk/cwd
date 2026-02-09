import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const exportComments = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const siteId = c.req.query('siteId');
		let query = 'SELECT * FROM Comment';
		const params: any[] = [];

		if (siteId) {
			query += ' WHERE site_id = ?';
			params.push(siteId);
		}

		query += ' ORDER BY priority DESC, created DESC';

		const { results } = await c.env.CWD_DB.prepare(query).bind(...params).all();

		return c.json(results);
	} catch (e: any) {
		return c.json({ message: e.message || '导出失败' }, 500);
	}
};
