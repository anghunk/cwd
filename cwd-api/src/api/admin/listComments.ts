import { Context } from 'hono';
import { Bindings } from '../../bindings';
import { getCravatar } from '../../utils/getAvatar';

const COMMENT_AVATAR_PREFIX_KEY = 'comment_avatar_prefix';
const COMMENT_ADMIN_EMAIL_KEY = 'comment_admin_email';

export const listComments = async (c: Context<{ Bindings: Bindings }>) => {
	const page = parseInt(c.req.query('page') || '1');
	const limit = 10;
	const offset = (page - 1) * limit;

	const rawDomain = c.req.query('domain') || '';
	const domain = rawDomain.trim();

	let whereSql = '';
	const params: (string | number)[] = [];
	if (domain) {
		const pattern = `%://${domain}/%`;
		whereSql = 'WHERE post_slug LIKE ? OR url LIKE ?';
		params.push(pattern, pattern);
	}

	const totalCount = await c.env.CWD_DB.prepare(
		`SELECT COUNT(*) as count FROM Comment ${whereSql}`
	)
		.bind(...params)
		.first<{ count: number }>();

	const { results } = await c.env.CWD_DB.prepare(
		`SELECT * FROM Comment ${whereSql} ORDER BY created DESC LIMIT ? OFFSET ?`
	)
		.bind(...params, limit, offset)
		.all();

	await c.env.CWD_DB.prepare(
		'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
	).run();
	const [avatarRow, adminEmailRow] = await Promise.all([
		c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
			.bind(COMMENT_AVATAR_PREFIX_KEY)
			.first<{ value: string }>(),
		c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
			.bind(COMMENT_ADMIN_EMAIL_KEY)
			.first<{ value: string }>()
	]);
	const avatarPrefix = avatarRow?.value || null;
	const adminEmail = adminEmailRow?.value || null;

	const data = await Promise.all(
		results.map(async (row: any) => ({
			id: row.id,
			created: row.created,
			name: row.name,
			email: row.email,
			postSlug: row.post_slug,
			url: row.url,
			ipAddress: row.ip_address,
			contentText: row.content_text,
			contentHtml: row.content_html,
			status: row.status,
			priority: row.priority,
			likes:
				typeof row.likes === 'number' && Number.isFinite(row.likes) && row.likes >= 0
					? row.likes
					: 0,
			ua: row.ua,
			avatar: await getCravatar(row.email, avatarPrefix || undefined),
			isAdmin: adminEmail && row.email === adminEmail
		}))
	);

	return c.json({
		data,
		pagination: {
			page,
			limit,
			total: Math.ceil(((totalCount?.count as number) || 0) / limit)
		}
	});
};
