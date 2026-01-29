import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const getConfigs = async (env: Bindings) => {
    await env.CWD_DB.prepare(
        'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
    ).run();

    const { results } = await env.CWD_DB.prepare('SELECT * FROM Settings').all();
    return results;
};

export const exportConfig = async (c: Context<{ Bindings: Bindings }>) => {
    try {
        const results = await getConfigs(c.env);
        return c.json(results);
    } catch (e: any) {
        return c.json({ message: e.message || '导出配置失败' }, 500);
    }
};
