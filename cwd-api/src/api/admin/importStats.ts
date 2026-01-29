import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const saveStatsData = async (env: Bindings, data: any) => {
    // Ensure tables exist
    await env.CWD_DB.exec(`
        CREATE TABLE IF NOT EXISTS page_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_slug TEXT UNIQUE NOT NULL,
            post_title TEXT,
            post_url TEXT,
            pv INTEGER NOT NULL DEFAULT 0,
            last_visit_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS page_visit_daily (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            domain TEXT,
            count INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS Likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_slug TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            UNIQUE(page_slug, user_id)
        );
    `);

    const stmts: any[] = [];

    // 1. page_stats
    if (Array.isArray(data.page_stats)) {
        for (const item of data.page_stats) {
             const fields = ['post_slug', 'post_title', 'post_url', 'pv', 'last_visit_at', 'created_at', 'updated_at'];
             const values = [
                 item.post_slug,
                 item.post_title,
                 item.post_url,
                 item.pv,
                 item.last_visit_at,
                 item.created_at,
                 item.updated_at
             ];
             if (item.id) {
                 fields.unshift('id');
                 values.unshift(item.id);
             }
             const placeholders = fields.map(() => '?').join(', ');
             stmts.push(
                 env.CWD_DB.prepare(`INSERT OR REPLACE INTO page_stats (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values)
             );
        }
    }

    // 2. page_visit_daily
    if (Array.isArray(data.page_visit_daily)) {
        for (const item of data.page_visit_daily) {
             const fields = ['date', 'domain', 'count', 'created_at', 'updated_at'];
             const values = [
                 item.date,
                 item.domain,
                 item.count,
                 item.created_at,
                 item.updated_at
             ];
             if (item.id) {
                 fields.unshift('id');
                 values.unshift(item.id);
             }
             const placeholders = fields.map(() => '?').join(', ');
             stmts.push(
                 env.CWD_DB.prepare(`INSERT OR REPLACE INTO page_visit_daily (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values)
             );
        }
    }

    // 3. Likes
    if (Array.isArray(data.likes)) {
        for (const item of data.likes) {
             const fields = ['page_slug', 'user_id', 'created_at'];
             const values = [
                 item.page_slug,
                 item.user_id,
                 item.created_at
             ];
             if (item.id) {
                 fields.unshift('id');
                 values.unshift(item.id);
             }
             const placeholders = fields.map(() => '?').join(', ');
             stmts.push(
                 env.CWD_DB.prepare(`INSERT OR REPLACE INTO Likes (${fields.join(', ')}) VALUES (${placeholders})`).bind(...values)
             );
        }
    }

    // Batch execute
    const BATCH_SIZE = 50;
    for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
        const batch = stmts.slice(i, i + BATCH_SIZE);
        await env.CWD_DB.batch(batch);
    }
};

export const importStats = async (c: Context<{ Bindings: Bindings }>) => {
    try {
        const body = await c.req.json();
        if (!body || typeof body !== 'object') {
             return c.json({ message: '数据格式错误' }, 400);
        }

        await saveStatsData(c.env, body);

        const statsCount = (body.page_stats?.length || 0) + (body.page_visit_daily?.length || 0) + (body.likes?.length || 0);
        return c.json({ message: `成功导入 ${statsCount} 条统计数据` });
    } catch (e: any) {
        console.error(e);
        return c.json({ message: e.message || '导入统计数据失败' }, 500);
    }
};
