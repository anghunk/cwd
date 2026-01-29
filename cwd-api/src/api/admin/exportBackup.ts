import { Context } from 'hono';
import { Bindings } from '../../bindings';
import { getConfigs } from './exportConfig';
import { getStatsData } from './exportStats';

export const exportBackup = async (c: Context<{ Bindings: Bindings }>) => {
    try {
        const { results: comments } = await c.env.CWD_DB.prepare(
            'SELECT * FROM Comment ORDER BY priority DESC, created DESC'
        ).all();

        const configs = await getConfigs(c.env);
        const stats = await getStatsData(c.env);

        const backupData = {
            version: '1.0',
            timestamp: Date.now(),
            comments: comments,
            settings: configs,
            page_stats: stats.page_stats,
            page_visit_daily: stats.page_visit_daily,
            likes: stats.likes
        };

        return c.json(backupData);
    } catch (e: any) {
        return c.json({ message: e.message || '全量导出失败' }, 500);
    }
};
