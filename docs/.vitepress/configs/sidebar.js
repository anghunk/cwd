export const rootSidebar = [
	{
		text: '快速开始',
		items: [
			{ text: '项目介绍', link: '/guide/getting-started' },
			{ text: '后端配置', link: '/guide/backend-config' },
			{ text: '前端配置', link: '/guide/frontend-config' },
			{ text: '更新部署', link: '/guide/update-version' },
		],
	},
	{
		text: '功能',
		items: [
			{ text: '后台设置', link: '/function/admin-panel' },
			{ text: '通知邮箱', link: '/function/email-reminder' },
			{ text: '安全设置', link: '/function/security-settings' },
			{ text: '数据迁移', link: '/function/data-migration' },
			{ text: '点赞开关', link: '/function/feature-settings' },
			{ text: '数据统计', link: '/function/data-statistics' },
		],
	},
	{ text: '反馈', link: '/guide/feedback' },
];

export const apiSidebar = [
	{
		text: 'API 文档',
		items: [
			{ text: '概览', link: '/api/overview' },
			{ text: '公开 API', link: '/api/public' },
			{
				text: '管理员 API',
				items: [
					{ text: '概览', link: '/api/admin' },
					{ text: '身份认证', link: '/api/admin/auth' },
					{ text: '评论管理', link: '/api/admin/comments' },
					{ text: '数据迁移', link: '/api/admin/data-migration' },
					{ text: '评论设置', link: '/api/admin/settings' },
					{ text: '邮件通知', link: '/api/admin/email-notify' },
					{ text: '统计数据', link: '/api/admin/stats' },
					{ text: '访问统计', link: '/api/admin/analytics' },
					{ text: '点赞开关', link: '/api/admin/feature-settings' },
				],
			},
		],
	},
];
