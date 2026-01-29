import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const getStatsData = async (env: Bindings) => {
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

    const { results: pageStats } = await env.CWD_DB.prepare('SELECT * FROM page_stats').all();
    const { results: dailyVisits } = await env.CWD_DB.prepare('SELECT * FROM page_visit_daily').all();
    const { results: likes } = await env.CWD_DB.prepare('SELECT * FROM Likes').all();

    return {
        page_stats: pageStats,
        page_visit_daily: dailyVisits,
        likes: likes
    };
};

export const exportStats = async (c: Context<{ Bindings: Bindings }>) => {
    try {
        const data = await getStatsData(c.env);
        return c.json(data);
    } catch (e: any) {
        return c.json({ message: e.message || '导出统计数据失败' }, 500);
    }
};
