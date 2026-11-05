import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import nimbus, { defineConfig as defineNimbusConfig } from '@cloudflare/nimbus-docs';
import { tableScroll } from '@cloudflare/nimbus-docs/markdown';

const nimbusConfig = defineNimbusConfig({
	site: 'https://cwd.js.org',
	title: 'CWD 评论系统文档',
	description: '基于 Cloudflare Workers 与全球边缘网络的免服务器、极速安全、即插即用评论系统。',
	locale: 'zh-CN',
	homeLabel: '首页',
	github: 'https://github.com/anghunk/cwd',
	socialImage: '/icon.png',
	socialImageAlt: 'CWD 评论系统',
	sidebar: {
		defaultCollapsed: true,
		items: [
			{ label: '首页', link: '/' },
			{
				label: '快速开始',
				collapsed: false,
				items: [
					{ label: '项目介绍', link: '/guide/getting-started' },
					{ label: '后端配置', link: '/guide/backend-config' },
					{ label: '前端配置', link: '/guide/frontend-config' },
					{ label: '人机验证', link: '/guide/turnstile' },
					{ label: '更新部署', link: '/guide/update-version' },
				],
			},
			{
				label: '功能',
				items: [
					{ label: '后台设置', link: '/function/admin-panel' },
					{ label: '邮箱提醒', link: '/function/email-reminder' },
					{ label: 'Telegram 通知', link: '/function/telegram-notify' },
					{ label: '安全设置', link: '/function/security-settings' },
					{ label: '功能开关', link: '/function/feature-settings' },
					{ label: '数据看板', link: '/function/data-statistics' },
					{ label: '数据管理', link: '/function/data-migration' },
				],
			},
			{
				label: '配置',
				items: [
					{ label: '站点隔离', link: '/config/site-isolation' },
					{ label: '页面浏览量', link: '/config/views-display' },
				],
			},
			{
				label: 'API 文档',
				items: [
					{ label: '概览', link: '/api/overview' },
					{
						label: '公开 API',
						items: [
							{ label: '评论接口', link: '/api/public/comments' },
							{ label: '点赞接口', link: '/api/public/like' },
							{ label: '配置接口', link: '/api/public/config' },
							{ label: '身份验证', link: '/api/public/auth' },
							{ label: '访问统计', link: '/api/public/analytics' },
						],
					},
					{
						label: '管理员 API',
						items: [
							{ label: '概览', link: '/api/admin' },
							{ label: '身份认证', link: '/api/admin/auth' },
							{ label: '评论管理', link: '/api/admin/comments' },
							{ label: '数据管理', link: '/api/admin/data-migration' },
							{ label: '评论设置', link: '/api/admin/settings' },
							{ label: '邮件通知', link: '/api/admin/email-notify' },
							{ label: 'Telegram 通知', link: '/api/admin/telegram-notify' },
							{ label: '统计数据', link: '/api/admin/stats' },
							{ label: '访问统计', link: '/api/admin/analytics' },
							{ label: '功能设置', link: '/api/admin/feature-settings' },
							{ label: 'S3 备份', link: '/api/admin/s3-backup' },
						],
					},
				],
			},
			{ label: '反馈', link: '/guide/feedback' },
			{ label: '常见问题', link: '/common-problems' },
		],
	},
});

export default defineConfig({
	output: 'static',
	trailingSlash: 'always',
	vite: { plugins: [tailwindcss()] },
	prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
	integrations: [
		nimbus(nimbusConfig, {
			rules: {
				'nimbus/frontmatter-shape': 'error',
				'nimbus/internal-link': 'error',
			},
			markdown: {
				hastPlugins: [tableScroll()],
				features: { headingAttributes: true },
			},
		}),
	],
});
