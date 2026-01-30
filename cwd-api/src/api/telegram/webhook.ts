import { Context } from 'hono';
import { Bindings } from '../../bindings';
import { loadTelegramSettings, editMessageText, answerCallbackQuery } from '../../utils/telegram';

export const telegramWebhook = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const settings = await loadTelegramSettings(c.env);
		if (!settings.botToken) {
			return c.text('Bot token not configured', 400);
		}

		const update = await c.req.json();
		const { callback_query } = update;

		if (callback_query) {
			await handleCallbackQuery(c, settings.botToken, callback_query);
		}

		return c.text('OK');
	} catch (e: any) {
		console.error('Telegram Webhook Error:', e);
		return c.text('Internal Server Error', 500);
	}
};

async function handleCallbackQuery(c: Context<{ Bindings: Bindings }>, token: string, query: any) {
	const { data, message, id } = query;
	const chatId = message.chat.id;
	const messageId = message.message_id;

	if (!data) return;

	const [action, commentIdStr] = data.split(':');
	const commentId = parseInt(commentIdStr);

	if (isNaN(commentId)) {
		await answerCallbackQuery(token, id, 'Invalid Comment ID');
		return;
	}

	if (action === 'approve') {
		await c.env.CWD_DB.prepare('UPDATE Comment SET status = ? WHERE id = ?').bind('approved', commentId).run();

		const newText = message.text + '\n\n✅ 已批准 (Approved)';
		await editMessageText(token, chatId, messageId, newText);
		await answerCallbackQuery(token, id, '评论已批准');
	} else if (action === 'delete') {
		await c.env.CWD_DB.prepare('DELETE FROM Comment WHERE id = ?').bind(commentId).run();

		const newText = message.text + '\n\n🗑️ 已删除 (Deleted)';
		await editMessageText(token, chatId, messageId, newText);
		await answerCallbackQuery(token, id, '评论已删除');
	}
}
