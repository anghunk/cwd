const DNS_TIMEOUT_MS = 2500;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 256;

type MXResult = boolean | null;
type DnsResponse = {
	Status: number;
	TC?: boolean;
	Answer?: { type: number; data: string }[];
};

const cache = new Map<string, { result: boolean; expiresAt: number }>();
const pending = new Map<string, Promise<MXResult>>();

/** Normalize IDN domain names without accepting URL paths, credentials, or ports. */
function normalizeDomain(domain: string): string | null {
	const value = domain.trim();
	if (!value || /[\s/\\@:#?%]/.test(value)) return null;
	try {
		const name = new URL(`https://${value}`).hostname.toLowerCase().replace(/\.$/, '');
		if (name.length > 253 || name.split('.').some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
			return null;
		}
		return name;
	} catch {
		return null;
	}
}

/** Query only MX records; resolver failures remain unknown rather than rejecting comments. */
async function queryMX(domain: string, fetcher: typeof fetch): Promise<MXResult> {
	try {
		const url = new URL('https://cloudflare-dns.com/dns-query');
		url.searchParams.set('name', domain);
		url.searchParams.set('type', 'MX');
		const response = await fetcher(url, {
			headers: { Accept: 'application/dns-json' },
			signal: AbortSignal.timeout(DNS_TIMEOUT_MS),
		});
		if (!response.ok) return null;
		const data = (await response.json()) as DnsResponse;
		if (data.TC) return null;
		if (data.Status === 3) return false;
		if (data.Status !== 0 || (data.Answer !== undefined && !Array.isArray(data.Answer))) return null;

		let hasMX = false;
		for (const record of data.Answer ?? []) {
			if (record.type !== 15) continue;
			if (typeof record.data !== 'string') return null;
			const parts = /^(\d+)\s+(\S+)$/.exec(record.data.trim());
			if (!parts || Number(parts[1]) > 65535) return null;
			if (parts[2] === '.') continue;
			if (!normalizeDomain(parts[2])) return null;
			hasMX = true;
		}
		return hasMX;
	} catch {
		return null;
	}
}

/**
 * Check for a usable MX record, caching definitive results per domain for five minutes.
 * Returns null on lookup failure; no A/AAAA fallback or mailbox verification is performed.
 */
export async function hasMXRecord(domain: string, fetcher: typeof fetch = fetch): Promise<MXResult> {
	const name = normalizeDomain(domain);
	if (!name) return false;
	const cached = cache.get(name);
	if (cached && cached.expiresAt > Date.now()) return cached.result;
	cache.delete(name);
	const existing = pending.get(name);
	if (existing) return existing;
	if (pending.size >= MAX_CACHE_ENTRIES) return null;

	const lookup = queryMX(name, fetcher)
		.then(result => {
			if (result !== null) {
				if (cache.size >= MAX_CACHE_ENTRIES) {
					const oldest = cache.keys().next().value;
					if (oldest !== undefined) cache.delete(oldest);
				}
				cache.set(name, { result, expiresAt: Date.now() + CACHE_TTL_MS });
			}
			return result;
		})
		.finally(() => pending.delete(name));
	pending.set(name, lookup);
	return lookup;
}
