/**
 * 表情选择器组件。
 */

import { Component } from './Component.js';

export class EmotionPicker extends Component {
	/**
	 * @param {HTMLElement|string} container - 容器元素或选择器
	 * @param {Object} props - 组件属性
	 * @param {Array} props.groups - 表情分组
	 * @param {Function} props.onSelect - 选择表情回调
	 * @param {Function} props.t - 翻译函数
	 */
	constructor(container, props = {}) {
		super(container, props);
		this.t = props.t || ((key) => key);
		this.state = {
			open: false,
			activeGroup: props.groups?.[0]?.name || '',
		};
	}

	render() {
		const groups = Array.isArray(this.props.groups) ? this.props.groups : [];
		if (!groups.length) {
			this.elements.root = null;
			return;
		}

		const activeGroup = groups.find((group) => group.name === this.state.activeGroup) || groups[0];
		this.state.activeGroup = activeGroup.name;

		const root = this.createElement('div', {
			className: 'cwd-emotion-picker',
			children: [
				this.createElement('button', {
					className: 'cwd-emotion-trigger',
					attributes: {
						type: 'button',
						title: this.t('emotion'),
						'aria-label': this.t('emotion'),
						'aria-expanded': this.state.open ? 'true' : 'false',
						onClick: () => this.toggle(),
					},
					children: [this.createTriggerIcon()],
				}),
				...(this.state.open
					? [
							this.createElement('div', {
								className: 'cwd-emotion-popover',
								children: [
									this.createElement('div', {
										className: 'cwd-emotion-tabs',
										children: groups.map((group) =>
											this.createElement('button', {
												className: `cwd-emotion-tab ${group.name === activeGroup.name ? 'cwd-emotion-tab-active' : ''}`,
												attributes: {
													type: 'button',
													onClick: () => this.setActiveGroup(group.name),
												},
												text: group.name,
											})
										),
									}),
									this.createElement('div', {
										className: `cwd-emotion-grid cwd-emotion-grid-${activeGroup.type}`,
										children: activeGroup.items.map((item) => this.createEmotionButton(item)),
									}),
								],
							}),
						]
					: []),
			],
		});

		this.elements.root = root;
		this.empty(this.container);
		this.container.appendChild(root);
	}

	/**
	 * 创建表情触发按钮图标。
	 *
	 * @returns {SVGElement}
	 */
	createTriggerIcon() {
		return this.createElement('svg', {
			className: 'cwd-emotion-trigger-icon',
			attributes: {
				viewBox: '0 0 24 24',
				'aria-hidden': 'true',
			},
			children: [
				this.createElement('circle', {
					attributes: {
						cx: '12',
						cy: '12',
						r: '9',
						fill: 'none',
						stroke: 'currentColor',
						'stroke-width': '1.8',
					},
				}),
				this.createElement('circle', {
					attributes: {
						cx: '9',
						cy: '10',
						r: '1.2',
						fill: 'currentColor',
					},
				}),
				this.createElement('circle', {
					attributes: {
						cx: '15',
						cy: '10',
						r: '1.2',
						fill: 'currentColor',
					},
				}),
				this.createElement('path', {
					attributes: {
						d: 'M8 14.5c1 1.6 2.3 2.4 4 2.4s3-.8 4-2.4',
						fill: 'none',
						stroke: 'currentColor',
						'stroke-width': '1.8',
						'stroke-linecap': 'round',
					},
				}),
			],
		});
	}

	/**
	 * 创建单个表情按钮。
	 *
	 * @param {Object} item - 表情项
	 * @returns {HTMLElement}
	 */
	createEmotionButton(item) {
		return this.createElement('button', {
			className: 'cwd-emotion-item',
			attributes: {
				type: 'button',
				title: item.label,
				onClick: () => this.select(item),
			},
			children: [
				item.type === 'image'
					? this.createElement('img', {
							className: 'cwd-emotion-image',
							attributes: {
								src: item.url,
								alt: item.label,
								loading: 'lazy',
							},
						})
					: this.createTextElement('span', item.icon, 'cwd-emotion-text'),
			],
		});
	}

	toggle() {
		this.state.open = !this.state.open;
		this.render();
	}

	setActiveGroup(name) {
		this.state.activeGroup = name;
		this.render();
	}

	select(item) {
		if (this.props.onSelect) {
			this.props.onSelect(item);
		}
		this.state.open = false;
		this.render();
	}
}
