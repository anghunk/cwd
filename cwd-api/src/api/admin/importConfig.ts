import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const saveConfigs = async (env: Bindings, configs: any[]) => {
    if (!Array.isArray(configs) || configs.length === 0) {
        return;
    }

    await env.CWD_DB.prepare(
        'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
    ).run();

    const stmts = configs.map((item) => {
        return env.CWD_DB.prepare(
            'REPLACE INTO Settings (key, value) VALUES (?, ?)'
        ).bind(item.key, item.value);
    });

    // Batch execute
    const BATCH_SIZE = 50;
    for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
        const batch = stmts.slice(i, i + BATCH_SIZE);
        await env.CWD_DB.batch(batch);
    }
};

export const importConfig = async (c: Context<{ Bindings: Bindings }>) => {
    try {
        const body = await c.req.json();
        const configs = Array.isArray(body) ? body : [body];

        if (configs.length === 0) {
            return c.json({ message: '导入数据为空' }, 400);
        }

        // Validate basic structure
        const validConfigs = configs.filter((item: any) => item && item.key && typeof item.value === 'string');
        
        if (validConfigs.length === 0) {
             return c.json({ message: '没有有效的配置数据' }, 400);
        }

        await saveConfigs(c.env, validConfigs);

        return c.json({ message: `成功导入 ${validConfigs.length} 条配置` });
    } catch (e: any) {
        console.error(e);
        return c.json({ message: e.message || '导入配置失败' }, 500);
    }
};
