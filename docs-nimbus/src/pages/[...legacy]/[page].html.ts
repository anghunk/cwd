import type { APIRoute, GetStaticPaths } from 'astro';
import { getDocsStaticPaths, withBase } from '@cloudflare/nimbus-docs/runtime';

/**
 * 为已发布文档的内页生成旧版 VitePress 的 .html 文件，首页继续使用现有 index.html。
 * @param options Astro 提供的静态路径生成上下文。
 * @returns 与当前文档一一对应的兼容路径，不生成不存在或草稿页面的跳转。
 */
export const getStaticPaths: GetStaticPaths = async (options) =>
	(await getDocsStaticPaths(options)).flatMap(({ params }) => {
		if (typeof params.slug !== 'string' || !params.slug) return [];
		const segments = params.slug.split('/');
		return [{ params: { legacy: segments.slice(0, -1).join('/') || undefined, page: segments[segments.length - 1] } }];
	});

/**
 * 将构建生成的 URL 转义为安全的 HTML 属性值。
 * @param value 待写入属性的路径或规范地址。
 * @returns 已转义 HTML 特殊字符的属性值。
 */
function escapeAttribute(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * 输出 GitHub Pages 可直接托管的跳转页；目标使用目录地址，避免无后缀地址再次匹配当前 .html 文件。
 * 启用 JavaScript 时保留查询参数和锚点，并替换当前历史记录。
 * @param context 静态路径生成器提供的路由参数及站点配置。
 * @returns 含规范地址、无脚本回退和可点击链接的 HTML 响应。
 */
export const GET: APIRoute = ({ params, site }) => {
	const destination = withBase(`/${[params.legacy, params.page].filter(Boolean).join('/')}/`, import.meta.env.BASE_URL);
	const canonical = site ? new URL(destination, site).href : destination;
	const href = escapeAttribute(destination);
	const scriptDestination = JSON.stringify(destination).replace(/</g, '\\u003c');

	return new Response(
		`<!doctype html>
<html lang="zh-CN">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta name="robots" content="noindex">
		<link rel="canonical" href="${escapeAttribute(canonical)}">
		<title>正在跳转至文档新地址</title>
		<script>
			const target = new URL(${scriptDestination}, window.location.href);
			target.search = window.location.search;
			target.hash = window.location.hash;
			window.location.replace(target.href);
		</script>
		<noscript><meta http-equiv="refresh" content="0;url=${href}"></noscript>
	</head>
	<body>
		<p>此页面已迁移，<a href="${href}">前往文档新地址</a>。</p>
	</body>
</html>`,
		{ headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
};
