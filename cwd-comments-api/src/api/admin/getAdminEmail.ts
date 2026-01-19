import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const getAdminEmail = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    await c.env.CWD_DB.prepare(
      'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
    ).run();
    const row = await c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
      .bind('admin_notify_email')
      .first<{ value: string }>();
    const email = row?.value || null;
    return c.json({ email });
  } catch (e: any) {
    return c.json({ message: e.message }, 500);
  }
};

