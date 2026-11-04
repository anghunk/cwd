/**
 * Loading 组件
 */

import { Component } from './Component.js';

export class Loading extends Component {
  /**
   * @param {HTMLElement|string} container - 容器元素或选择器
   * @param {Object} props - 组件属性
   * @param {string} props.text - 加载文本
   */
  constructor(container, props = {}) {
    super(container, {
      text: '加载中...',
      ...props
    });
  }

  render() {
    const root = this.createElement('div', {
      className: 'cwd-loading',
      children: [
        this.createElement('div', { className: 'cwd-spinner' }),
        this.createTextElement('span', this.props.text, 'cwd-loading-text')
      ]
    });

    this.elements.root = root;
    this.empty(this.container);
    this.container.appendChild(root);
  }

  /**
   * 更新加载文本
   * @param {string} text - 新文本
   */
  setText(text) {
    this.props.text = text;
    const textEl = this.elements.root.querySelector('.cwd-loading-text');
    if (textEl) {
      textEl.textContent = text;
    }
  }
}
