import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let hasMXRecord: typeof import('./emailMx')['hasMXRecord'];

beforeEach(async () => {
	vi.resetModules();
	({ hasMXRecord } = await import('./emailMx'));
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('hasMXRecord', () => {
	it('queries MX through Cloudflare DoH with a timeout', async () => {
		const timeout = vi.spyOn(AbortSignal, 'timeout');
		const fetcher = vi.fn().mockResolvedValue(Response.json({ Status: 0, Answer: [{ type: 15, data: '10 mx.qq.com.' }] }));

		await expect(hasMXRecord('QQ.COM.', fetcher as typeof fetch)).resolves.toBe(true);
		const [url, options] = fetcher.mock.calls[0];
		expect(url.origin).toBe('https://cloudflare-dns.com');
		expect(url.pathname).toBe('/dns-query');
		expect(url.searchParams.get('name')).toBe('qq.com');
		expect(url.searchParams.get('type')).toBe('MX');
		expect(options.headers.Accept).toBe('application/dns-json');
		expect(timeout).toHaveBeenCalledWith(2500);
	});

	it.each([
		{ Status: 3 },
		{ Status: 0 },
		{ Status: 0, Answer: [] },
		{ Status: 0, Answer: [{ type: 5, data: 'alias.example.com.' }] },
		{ Status: 0, Answer: [{ type: 15, data: '0 .' }] },
		{ Status: 0, Answer: [{ type: 15, data: ' 0\t. ' }] },
		{ Status: 0, Answer: [{ type: 1, data: '192.0.2.1' }, { type: 28, data: '2001:db8::1' }] },
	])('rejects missing, null, or nonexistent MX records without A/AAAA fallback: %j', async payload => {
		const fetcher = vi.fn().mockResolvedValue(Response.json(payload));
		await expect(hasMXRecord('qq.co', fetcher as typeof fetch)).resolves.toBe(false);
		expect(fetcher).toHaveBeenCalledOnce();
		expect(fetcher.mock.calls[0][0].searchParams.get('type')).toBe('MX');
	});

	it('recognizes an MX answer alongside a CNAME record', async () => {
		const fetcher = vi.fn().mockResolvedValue(Response.json({
			Status: 0,
			Answer: [{ type: 5, data: 'alias.example.com.' }, { type: 15, data: '0\tmail.example.com.' }],
		}));
		await expect(hasMXRecord('example.com', fetcher as typeof fetch)).resolves.toBe(true);
	});

	it('normalizes IDN domains before querying', async () => {
		const fetcher = vi.fn().mockResolvedValue(Response.json({ Status: 0, Answer: [{ type: 15, data: '10 mail.example.com.' }] }));
		await expect(hasMXRecord('b\u00fccher.de', fetcher as typeof fetch)).resolves.toBe(true);
		expect(fetcher.mock.calls[0][0].searchParams.get('name')).toBe('xn--bcher-kva.de');
	});

	it.each(['', 'bad domain.com', 'example.com/path', 'example.com:443', 'name@example.com', 'example.com?x=1', 'qq%2ecom', '-bad.com', 'bad..com'])('rejects invalid domain input without a network request: %s', async domain => {
		const fetcher = vi.fn();
		await expect(hasMXRecord(domain, fetcher as typeof fetch)).resolves.toBe(false);
		expect(fetcher).not.toHaveBeenCalled();
	});

	it.each([
		{ Status: 2 },
		{ Status: 5 },
		{ Status: 0, TC: true },
		{ Status: 0, Answer: {} },
		{ Status: 0, Answer: [{ type: 15, data: '' }] },
		{ Status: 0, Answer: [{ type: 15, data: '65536 mail.example.com.' }] },
		{ Status: 0, Answer: [{ type: 15, data: '10 https://example.com/' }] },
		{ Status: 0, Answer: [{ type: 15, data: null }] },
		null,
	])('returns unknown for a failed, truncated, or malformed DNS response: %j', async payload => {
		const fetcher = vi.fn().mockResolvedValue(Response.json(payload));
		await expect(hasMXRecord('example.com', fetcher as typeof fetch)).resolves.toBeNull();
	});

	it('returns unknown on HTTP errors, invalid JSON, and network failures', async () => {
		const fetcher = vi.fn()
			.mockResolvedValueOnce(new Response('Unavailable', { status: 503 }))
			.mockResolvedValueOnce(new Response('not json'))
			.mockRejectedValueOnce(new Error('offline'));
		for (let i = 0; i < 3; i++) await expect(hasMXRecord('example.com', fetcher as typeof fetch)).resolves.toBeNull();
		expect(fetcher).toHaveBeenCalledTimes(3);
	});

	it('returns unknown when the lookup times out', async () => {
		const controller = new AbortController();
		vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
		const fetcher = vi.fn((_url: RequestInfo | URL, options?: RequestInit) => new Promise<Response>((_resolve, reject) => {
			options?.signal?.addEventListener('abort', () => reject(new Error('timeout')));
		}));
		const lookup = hasMXRecord('example.com', fetcher as typeof fetch);
		controller.abort();
		await expect(lookup).resolves.toBeNull();
	});

	it.each([true, false])('caches definitive results by normalized domain: %s', async result => {
		const fetcher = vi.fn().mockImplementation(async () => Response.json({ Status: 0, Answer: result ? [{ type: 15, data: '10 mail.example.com.' }] : [] }));
		await expect(hasMXRecord('EXAMPLE.COM', fetcher as typeof fetch)).resolves.toBe(result);
		await expect(hasMXRecord('example.com.', fetcher as typeof fetch)).resolves.toBe(result);
		expect(fetcher).toHaveBeenCalledOnce();
	});

	it('expires cache entries after five minutes', async () => {
		let now = 1000;
		vi.spyOn(Date, 'now').mockImplementation(() => now);
		const fetcher = vi.fn().mockImplementation(async () => Response.json({ Status: 0, Answer: [{ type: 15, data: '10 mx.example.com.' }] }));
		await hasMXRecord('example.com', fetcher as typeof fetch);
		now += 5 * 60 * 1000;
		await hasMXRecord('example.com', fetcher as typeof fetch);
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('does not cache transient failures', async () => {
		const fetcher = vi.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(Response.json({ Status: 0, Answer: [{ type: 15, data: '10 mx.example.com.' }] }));
		await expect(hasMXRecord('example.com', fetcher as typeof fetch)).resolves.toBeNull();
		await expect(hasMXRecord('example.com', fetcher as typeof fetch)).resolves.toBe(true);
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('coalesces concurrent lookups for the same domain', async () => {
		let resolve!: (response: Response) => void;
		const fetcher = vi.fn().mockReturnValue(new Promise<Response>(done => { resolve = done; }));
		const first = hasMXRecord('example.com', fetcher as typeof fetch);
		const second = hasMXRecord('EXAMPLE.COM.', fetcher as typeof fetch);
		resolve(Response.json({ Status: 0, Answer: [{ type: 15, data: '10 mail.example.com.' }] }));
		await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
		expect(fetcher).toHaveBeenCalledOnce();
	});

	it('bounds the cache instead of retaining every submitted domain', async () => {
		const fetcher = vi.fn().mockImplementation(async () => Response.json({ Status: 0 }));
		for (let i = 0; i < 257; i++) await hasMXRecord(`domain-${i}.example.com`, fetcher as typeof fetch);
		await hasMXRecord('domain-0.example.com', fetcher as typeof fetch);
		expect(fetcher).toHaveBeenCalledTimes(258);
	});
});
