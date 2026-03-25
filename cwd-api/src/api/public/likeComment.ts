import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const likeComment = async (c: Context<{ Bindings: Bindings }>) => {
	let body: any = null;
	try {
		body = await c.req.json();
	} catch {
		body = null;
	}

	const rawId =
		(body && (body.id ?? body.commentId)) ??
		c.req.query('id') ??
		c.req.query('commentId') ??
		null;

	const parsed =
		typeof rawId === 'number'
			? rawId
			: typeof rawId === 'string' && rawId.trim()
			? Number.parseInt(rawId.trim(), 10)
			: NaN;

	if (!Number.isFinite(parsed) || parsed <= 0) {
		return c.json({ message: 'Missing or invalid id' }, 400);
	}

	const id = parsed;
	const method = c.req.method;

	try {
		const existing = await c.env.CWD_DB.prepare(
			'SELECT id, likes FROM Comment WHERE id = ?'
		)
			.bind(id)
			.first<{ id: number; likes?: number }>();

		if (!existing) {
			return c.json({ message: 'Comment not found' }, 404);
		}

		const delta = method === 'DELETE' ? -1 : 1;
		const currentLikes = typeof existing.likes === 'number' && Number.isFinite(existing.likes) && existing.likes >= 0
			? existing.likes
			: 0;
		const newLikes = Math.max(0, currentLikes + delta);

		await c.env.CWD_DB.prepare(
			'UPDATE Comment SET likes = ? WHERE id = ?'
		)
			.bind(newLikes, id)
			.run();

		return c.json({ id, likes: newLikes });
	} catch (e: any) {
		return c.json({ message: e?.message || '操作失败' }, 500);
	}
};
