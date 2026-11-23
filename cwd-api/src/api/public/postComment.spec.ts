import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/email', () => ({
	sendCommentNotification: vi.fn(),
	sendCommentReplyNotification: vi.fn(),
	isValidEmail: () => true,
	getAdminNotifyEmail: vi.fn(),
	loadEmailNotificationSettings: vi.fn(),
}));

vi.mock('../../utils/telegram', () => ({
	loadTelegramSettings: vi.fn(),
	sendTelegramMessage: vi.fn(),
}));

import { postComment } from './postComment';
import { hasMXRecord } from '../../utils/emailMx';
import { loadEmailNotificationSettings, sendCommentNotification, sendCommentReplyNotification } from '../../utils/email';
import { loadTelegramSettings } from '../../utils/telegram';

vi.mock('../../utils/emailMx', () => ({ hasMXRecord: vi.fn() }));

/** Create a comment request backed by D1 mocks without external mail delivery. */
function createContext(email = 'reader@example.com', parentId: number | null = null) {
	const first = vi.fn().mockResolvedValue(null);
	const run = vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } });
	const bind = vi.fn().mockReturnValue({ first, run });
	const prepare = vi.fn().mockReturnValue({ bind });
	const tasks: Promise<unknown>[] = [];
	const context = {
		req: {
			json: vi.fn().mockResolvedValue({ post_slug: '/post', content: 'hello', name: 'Reader', email, parent_id: parentId, turnstileToken: 'token' }),
			header: (name: string) => name === 'cf-connecting-ip' ? '203.0.113.10' : 'test',
		},
		env: { CWD_DB: { prepare } },
		executionCtx: { waitUntil: (task: Promise<unknown>) => tasks.push(task) },
		json: vi.fn((body, status = 200) => ({ body, status })),
	} as any;
	return { context, first, run, prepare, tasks };
}

describe('postComment Turnstile ordering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(hasMXRecord).mockResolvedValue(true);
		vi.mocked(loadEmailNotificationSettings).mockResolvedValue({ globalEnabled: false });
		vi.mocked(loadTelegramSettings).mockResolvedValue({ notifyEnabled: false, botToken: '', chatId: '' });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('rejects a recent IP before calling Siteverify', async () => {
		const fetcher = vi.fn();
		vi.stubGlobal('fetch', fetcher);

		const first = vi.fn().mockResolvedValue({ created: Date.now() });
		const bind = vi.fn().mockReturnValue({ first });
		const prepare = vi.fn().mockReturnValue({ bind });
		const json = vi.fn((body, status) => ({ body, status }));
		const context = {
			req: {
				json: vi.fn().mockResolvedValue({
					post_slug: '/post',
					content: 'hello',
					name: 'Reader',
					email: 'reader@example.com',
					turnstileToken: 'token',
				}),
				header: (name: string) => (name === 'cf-connecting-ip' ? '203.0.113.10' : undefined),
			},
			env: {
				TURNSTILE_SECRET_KEY: 'secret',
				CWD_DB: { prepare },
			},
			json,
		} as any;

		await postComment(context);

		expect(json).toHaveBeenCalledWith(
			{ message: '评论频繁，等10s后再试', turnstileConsumed: false },
			429
		);
		expect(fetcher).not.toHaveBeenCalled();
		expect(hasMXRecord).not.toHaveBeenCalled();
		expect(prepare).toHaveBeenCalledTimes(1);
	});

	it.each([null, 1])('rejects invalid MX before consuming Turnstile or saving a comment (parent: %s)', async parentId => {
		const { context, run } = createContext('reader@qq.co', parentId);
		context.env.TURNSTILE_SECRET_KEY = 'secret';
		const fetcher = vi.fn();
		vi.stubGlobal('fetch', fetcher);
		vi.mocked(hasMXRecord).mockResolvedValue(false);

		await expect(postComment(context)).resolves.toEqual({
			body: { message: '邮箱域名未配置有效的 MX 记录，请检查邮箱是否填写正确', turnstileConsumed: false },
			status: 400,
		});
		expect(hasMXRecord).toHaveBeenCalledWith('qq.co');
		expect(fetcher).not.toHaveBeenCalled();
		expect(run).not.toHaveBeenCalled();
		expect(sendCommentNotification).not.toHaveBeenCalled();
		expect(sendCommentReplyNotification).not.toHaveBeenCalled();
	});

	it.each([true, null])('continues the normal comment flow for MX result %s', async result => {
		const { context, run, tasks } = createContext();
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.mocked(hasMXRecord).mockResolvedValue(result);

		await expect(postComment(context)).resolves.toMatchObject({ status: 200 });
		await Promise.all(tasks);
		expect(run).toHaveBeenCalledOnce();
	});

	it('still enforces Turnstile after a successful MX check', async () => {
		const { context, run } = createContext();
		context.env.TURNSTILE_SECRET_KEY = 'secret';
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const fetcher = vi.fn().mockResolvedValue(Response.json({ success: false }));
		vi.stubGlobal('fetch', fetcher);

		await expect(postComment(context)).resolves.toMatchObject({ status: 403 });
		expect(fetcher).toHaveBeenCalledOnce();
		expect(fetcher.mock.calls[0][0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
		expect(run).not.toHaveBeenCalled();
	});
});
