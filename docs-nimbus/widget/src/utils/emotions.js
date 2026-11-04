/**
 * 转义 HTML 属性值。
 *
 * @param {string} value - 待转义文本
 * @returns {string}
 */
function escapeAttribute(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * 清理表情包名称和图标名称，避免 JSON 注入路径控制字符。
 *
 * @param {string} value - 表情包或图标名称
 * @returns {string}
 */
function sanitizePathPart(value) {
	return String(value || '')
		.trim()
		.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * 拼接图片表情地址。
 *
 * @param {Object} group - 表情分组
 * @param {Object} item - 表情项
 * @returns {string}
 */
function resolveImageUrl(group, item) {
	if (typeof item.url === 'string' && item.url.trim()) {
		return item.url.trim();
	}

	const packName = sanitizePathPart(group.name);
	const iconName = sanitizePathPart(item.icon);
	const fileName = iconName.endsWith('.png') ? iconName : `${iconName}.png`;
	const baseUrl = typeof group.baseUrl === 'string' && group.baseUrl.trim()
		? group.baseUrl.trim().replace(/\/$/, '')
		: `/emotion/${packName}`;

	return `${baseUrl}/${fileName}`;
}

/**
 * 解析 OwO 风格表情 JSON。
 *
 * @param {Object} emotionJson - 表情 JSON 对象
 * @returns {Array<{name: string, type: string, items: Array}>}
 */
export function parseEmotionGroups(emotionJson) {
	if (!emotionJson) {
		return [];
	}

	if (typeof emotionJson !== 'object' || Array.isArray(emotionJson)) {
		return [];
	}

	return Object.entries(emotionJson)
		.map(([groupName, group]) => {
			if (!group || typeof group !== 'object' || !Array.isArray(group.container)) {
				return null;
			}

			const type = group.type === 'image' ? 'image' : 'emoticon';
			const items = group.container
				.map((item) => {
					if (!item || typeof item !== 'object' || typeof item.icon !== 'string') {
						return null;
					}

					const label = typeof item.text === 'string' && item.text ? item.text : item.icon;
					if (type === 'image') {
						const url = resolveImageUrl(group, item);
						return {
							type,
							icon: item.icon,
							label,
							url,
							insertValue: `<img class="tk-owo-emotion" src="${escapeAttribute(url)}" alt="${escapeAttribute(label)}" title="${escapeAttribute(label)}" />`,
						};
					}

					return {
						type,
						icon: item.icon,
						label,
						insertValue: item.icon,
					};
				})
				.filter(Boolean);

			if (!items.length) {
				return null;
			}

			return {
				name: groupName,
				type,
				items,
			};
		})
		.filter(Boolean);
}

/**
 * 从 JSON 文件链接加载并解析表情分组。
 *
 * @param {string|Object} emotionJsonUrl - 表情 JSON 文件链接；对象仅用于兼容直接传入已解析数据
 * @param {Function} fetchImpl - fetch 实现，测试时可注入
 * @returns {Promise<Array<{name: string, type: string, items: Array}>>}
 */
export async function loadEmotionGroups(emotionJsonUrl, fetchImpl = globalThis.fetch) {
	if (!emotionJsonUrl) {
		return [];
	}

	if (typeof emotionJsonUrl === 'object') {
		return parseEmotionGroups(emotionJsonUrl);
	}

	if (typeof emotionJsonUrl !== 'string' || !emotionJsonUrl.trim() || typeof fetchImpl !== 'function') {
		return [];
	}

	try {
		const response = await fetchImpl(emotionJsonUrl.trim(), { credentials: 'same-origin' });
		if (!response || !response.ok || typeof response.json !== 'function') {
			return [];
		}
		return parseEmotionGroups(await response.json());
	} catch {
		return [];
	}
}

/**
 * 在文本框光标位置插入内容。
 *
 * @param {HTMLTextAreaElement|Object} textarea - 文本框
 * @param {string} value - 插入内容
 * @returns {string}
 */
export function insertTextAtCursor(textarea, value) {
	const start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : textarea.value.length;
	const end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : textarea.value.length;
	const nextValue = `${textarea.value.slice(0, start)}${value}${textarea.value.slice(end)}`;
	const nextCaret = start + value.length;

	textarea.value = nextValue;
	if (typeof textarea.setSelectionRange === 'function') {
		textarea.setSelectionRange(nextCaret, nextCaret);
	}

	return nextValue;
}
