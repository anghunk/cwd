/**
 * 忽略新旧 Markdown 标题锚点中的分隔符差异，保留文字和数字用于匹配。
 * @param value 已解码的锚点或标题文本。
 * @returns 不含标点和组合音标的小写文本。
 */
function normalizeAnchor(value: string): string {
	return value.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

/** 旧锚点无法直接定位时，滚动到唯一匹配的正文标题；无匹配或歧义时保持原位置。 */
function scrollToLegacyHeading(): void {
	let anchor: string;
	try {
		anchor = decodeURIComponent(window.location.hash.slice(1));
	} catch {
		return;
	}
	if (!anchor || document.getElementById(anchor)) return;

	const normalized = normalizeAnchor(anchor);
	if (!normalized) return;

	const headings = document.querySelectorAll<HTMLHeadingElement>('main h1, .docs-content :is(h2, h3, h4, h5, h6)');
	const matches = Array.from(headings).filter((heading) => normalizeAnchor(heading.id || heading.textContent || '') === normalized);
	if (matches.length !== 1) return;

	// 页面标题没有锚点时回到页首，避免固定页眉遮住标题。
	if (!matches[0].id) window.scrollTo({ top: 0 });
	else matches[0].scrollIntoView();
}

document.addEventListener('astro:page-load', scrollToLegacyHeading);
window.addEventListener('hashchange', scrollToLegacyHeading);
