
import { Context } from 'hono';
import { Bindings } from '../../bindings';
import {
	loadTelegramSettings,
	saveTelegramSettings,
	setTelegramWebhook,
	sendTelegramMessage
} from '../../utils/telegram';

export const getTelegramSettings = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const settings = await loadTelegramSettings(c.env);
		return c.json(settings);
	} catch (e: any) {
		return c.json({ message: e.message || '加载配置失败' }, 500);
	}
};

export const updateTelegramSettings = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const body = await c.req.json();
		const botToken = typeof body.botToken === 'string' ? body.botToken.trim() : null;
		const chatId = typeof body.chatId === 'string' ? body.chatId.trim() : null;
		const notifyEnabled = !!body.notifyEnabled;

		await saveTelegramSettings(c.env, { botToken, chatId, notifyEnabled });
		return c.json({ message: '保存成功' });
	} catch (e: any) {
		return c.json({ message: e.message || '保存失败' }, 500);
	}
};

export const setupTelegramWebhook = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const settings = await loadTelegramSettings(c.env);
		if (!settings.botToken) {
			return c.json({ message: '请先保存机器人 Token' }, 400);
		}

		const url = new URL(c.req.url);
		const webhookUrl = `${url.protocol}//${url.host}/api/telegram/webhook`;

		const result = await setTelegramWebhook(settings.botToken, webhookUrl);
		if (!result.ok) {
			return c.json({ message: `Webhook 设置失败: ${result.description}` }, 400);
		}

		return c.json({ message: 'Webhook 设置成功', webhookUrl });
	} catch (e: any) {
		return c.json({ message: e.message || '设置失败' }, 500);
	}
};

export const testTelegramMessage = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const settings = await loadTelegramSettings(c.env);
		if (!settings.botToken || !settings.chatId) {
			return c.json({ message: '请先配置 Bot Token 和 Chat ID' }, 400);
		}

		const text = `CWD 评论系统测试消息\n时间: ${new Date().toISOString()}`;
		const result = await sendTelegramMessage(settings.botToken, settings.chatId, text);

		if (!result.ok) {
			return c.json({ message: `发送失败: ${result.description || '未知错误'}` }, 400);
		}

		return c.json({ message: '测试消息已发送' });
	} catch (e: any) {
		return c.json({ message: e.message || '发送失败' }, 500);
	}
};
