import { mount } from '@cloudflare/nimbus-docs/client';

type CommentsTheme = 'light' | 'dark';

/** 原文档评论挂件使用的配置，页面标识保持与 VitePress 一致。 */
interface CommentsConfig {
	el: HTMLElement;
	apiBaseUrl: string;
	siteId: string;
	postSlug: string;
	theme: CommentsTheme;
	lang: 'zh-CN';
}

/** 评论实例的生命周期与主题同步接口。 */
interface CommentsInstance {
	/** 将评论挂件挂载到配置指定的元素。 */
	mount(): void;
	/** 释放挂件的组件及订阅。 */
	unmount(): void;
	/** 更新主题，保留当前评论及编辑状态。 */
	updateConfig(config: { theme: CommentsTheme }): void;
}

type CommentsConstructor = new (config: CommentsConfig) => CommentsInstance;

declare global {
	interface Window {
		/** 由本站构建生成的 cwd.js 脚本注册的评论组件。 */
		CWDComments?: CommentsConstructor;
	}
}

const WIDGET_URL = `${import.meta.env.BASE_URL.replace(/\/+$/, '')}/cwd.js`;
const API_BASE_URL = 'https://cwd-api.zishu.me';
let widgetPromise: Promise<CommentsConstructor> | undefined;

/**
 * 加载本站发布的 Widget 脚本，并在多个页面间共享一次加载。
 * @returns 评论组件构造器；网络失败或加载超时时允许用户重试。
 */
function loadWidget(): Promise<CommentsConstructor> {
	if (window.CWDComments) return Promise.resolve(window.CWDComments);
	if (widgetPromise) return widgetPromise;

	widgetPromise = new Promise<CommentsConstructor>((resolve, reject) => {
		const script = document.createElement('script');
		script.src = WIDGET_URL;
		script.async = true;
		script.dataset.cwdWidget = 'true';

		/** 清理本次脚本请求的事件和超时计时器。 */
		const clearRequest = () => {
			window.clearTimeout(timeout);
			script.onload = null;
			script.onerror = null;
		};

		/** 释放失败的脚本元素，并将错误交给页面重试入口。 */
		const fail = () => {
			clearRequest();
			script.remove();
			reject(new Error('评论脚本加载失败'));
		};

		const timeout = window.setTimeout(fail, 15000);
		script.onerror = fail;
		script.onload = () => {
			if (!window.CWDComments) {
				fail();
				return;
			}
			clearRequest();
			resolve(window.CWDComments);
		};
		document.head.appendChild(script);
	}).catch((error: unknown) => {
		widgetPromise = undefined;
		throw error;
	});

	return widgetPromise;
}

/** 返回当前 Nimbus 页面实际使用的明暗主题。 */
function getTheme(): CommentsTheme {
	return document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light';
}

/**
 * 初始化单页评论，并在 Astro 页面切换前释放实例和监听器。
 * @param root 当前页面的评论区域。
 * @returns 页面离开时执行的清理函数。
 */
function initComments(root: HTMLElement): () => void {
	const host = root.querySelector<HTMLElement>('[data-cwd-comments-host]');
	const status = root.querySelector<HTMLElement>('[data-cwd-comments-status]');
	const retry = root.querySelector<HTMLButtonElement>('[data-cwd-comments-retry]');
	const postSlug = root.dataset.postSlug;
	if (!host || !status || !retry || !postSlug) return () => {};

	let instance: CommentsInstance | undefined;
	let disposed = false;
	let loading = false;

	/** 加载当前页面的挂件；页面已离开时不再挂载异步结果。 */
	async function loadComments(): Promise<void> {
		if (disposed || loading) return;
		loading = true;
		status!.hidden = false;
		status!.textContent = '评论加载中…';
		retry!.hidden = true;

		try {
			const Widget = await loadWidget();
			if (disposed || !root.isConnected) return;

			// 重试时使用新的挂载元素，避免在已有 ShadowRoot 上重复 attachShadow。
			const mountPoint = document.createElement('div');
			host!.replaceChildren(mountPoint);
			instance = new Widget({
				el: mountPoint,
				apiBaseUrl: API_BASE_URL,
				siteId: 'cwd-doc',
				postSlug: postSlug!,
				theme: getTheme(),
				lang: 'zh-CN',
			});
			instance.mount();
			status!.hidden = true;
		} catch {
			if (disposed) return;
			instance?.unmount();
			instance = undefined;
			host!.replaceChildren();
			status!.textContent = '评论暂时无法加载，请检查网络后重试。';
			retry!.hidden = false;
		} finally {
			loading = false;
		}
	}

	const themeObserver = new MutationObserver(() => instance?.updateConfig({ theme: getTheme() }));
	themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
	retry.addEventListener('click', loadComments);
	void loadComments();

	return () => {
		disposed = true;
		themeObserver.disconnect();
		retry.removeEventListener('click', loadComments);
		instance?.unmount();
		host.replaceChildren();
	};
}

mount('[data-cwd-comments]', initComments);
