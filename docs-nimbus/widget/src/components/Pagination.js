/**
 * Pagination 分页组件
 */

import { Component } from './Component.js';

export class Pagination extends Component {
  /**
   * @param {HTMLElement|string} container - 容器元素或选择器
   * @param {Object} props - 组件属性
   * @param {number} props.currentPage - 当前页码
   * @param {number} props.totalPages - 总页数
   * @param {Function} props.onPrev - 上一页回调
   * @param {Function} props.onNext - 下一页回调
   * @param {Function} props.onGoTo - 跳转页码回调
   */
  constructor(container, props = {}) {
    super(container, props);
    this.state = {
      currentPage: props.currentPage || 1,
      totalPages: props.totalPages || 1
    };
  }

  /**
   * 计算显示的页码（最多5个）
   * @returns {number[]}
   */
  getDisplayedPages() {
    const { currentPage, totalPages } = this.state;
    const pages = [];
    const maxVisible = 5;
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    for (let i = end - maxVisible + 1; i <= end; i++) {
      if (i >= 1) {
        pages.push(i);
      }
    }

    return pages.slice(0, maxVisible);
  }

  render() {
    if (this.state.totalPages <= 1) {
      this.empty(this.container);
      return;
    }

    const displayedPages = this.getDisplayedPages();

    const root = this.createElement('div', {
      className: 'cwd-pagination',
      children: [
        // 上一页按钮
        this.createElement('button', {
          className: 'cwd-page-btn',
          attributes: {
            type: 'button',
            disabled: this.state.currentPage === 1,
            onClick: () => this.handlePrev()
          },
          text: '上一页'
        }),

        // 页码按钮
        this.createElement('div', {
          className: 'cwd-page-numbers',
          children: displayedPages.map(page =>
            this.createElement('button', {
              className: `cwd-page-num ${page === this.state.currentPage ? 'cwd-page-num-active' : ''}`,
              attributes: {
                type: 'button',
                onClick: () => this.handleGoTo(page)
              },
              text: page.toString()
            })
          )
        }),

        // 下一页按钮
        this.createElement('button', {
          className: 'cwd-page-btn',
          attributes: {
            type: 'button',
            disabled: this.state.currentPage === this.state.totalPages,
            onClick: () => this.handleNext()
          },
          text: '下一页'
        })
      ]
    });

    this.elements.root = root;
    this.empty(this.container);
    this.container.appendChild(root);
  }

  updateProps() {
    // 更新状态并重新渲染
    this.state.currentPage = this.props.currentPage;
    this.state.totalPages = this.props.totalPages;
    this.render();
  }

  handlePrev() {
    if (this.props.onPrev) {
      this.props.onPrev();
    }
  }

  handleNext() {
    if (this.props.onNext) {
      this.props.onNext();
    }
  }

  handleGoTo(page) {
    if (this.props.onGoTo) {
      this.props.onGoTo(page);
    }
  }
}
