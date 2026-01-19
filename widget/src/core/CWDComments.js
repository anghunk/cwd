/**
 * CWDComments 主类
 * 使用 Shadow DOM 隔离样式
 */

import { createApiClient } from './api.js';
import { createCommentStore } from './store.js';
import { CommentForm } from '@/components/CommentForm.js';
import { CommentList } from '@/components/CommentList.js';
import styles from '@/styles/main.css?inline';

/**
 * CWDComments 评论组件主类
 */
export class CWDComments {
  /**
   * @param {Object} config - 配置对象
   * @param {string|HTMLElement} config.el - 挂载元素选择器或 DOM 元素
   * @param {string} config.apiBaseUrl - API 基础地址
   * @param {string} config.postSlug - 文章标识符
   * @param {string} config.postTitle - 文章标题（可选）
   * @param {string} config.postUrl - 文章 URL（可选）
   * @param {'light'|'dark'} config.theme - 主题
   * @param {number} config.pageSize - 每页评论数
   * @param {string} config.avatarPrefix - 头像服务前缀（可选，默认 https://gravatar.com/avatar/）
   * @param {string} config.adminEmail - 博主邮箱（可选，用于显示博主标识）
   * @param {string} config.adminBadge - 博主标识文字（可选，默认"博主"）
   */
  constructor(config) {
    this.config = { ...config };
    if (!this.config.postTitle && typeof document !== 'undefined') {
      this.config.postTitle = document.title || this.config.postSlug;
    }
    if (!this.config.postUrl && typeof window !== 'undefined') {
      this.config.postUrl = window.location.href;
    }
    this.hostElement = this._resolveElement(config.el);
    this.shadowRoot = null;
    this.mountPoint = null;
    this.commentForm = null;
    this.commentList = null;
    this.store = null;
    this.unsubscribe = null;

    // 初始加载标志
    this._mounted = false;
  }

  /**
   * 解析挂载元素
   * @private
   */
  _resolveElement(el) {
    if (typeof el === 'string') {
      const element = document.querySelector(el);
      if (!element) {
        throw new Error(`元素未找到: ${el}`);
      }
      if (!(element instanceof HTMLElement)) {
        throw new Error(`目标不是 HTMLElement: ${el}`);
      }
      return element;
    }
    return el;
  }

  /**
   * 挂载组件
   */
  mount() {
    if (this._mounted) {
      return;
    }

    // 创建 Shadow DOM
    this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });

    // 注入样式
    const styleElement = document.createElement('style');
    if (typeof styles === 'string') {
      styleElement.textContent = styles;
    } else if (styles && typeof styles === 'object' && 'default' in styles) {
      styleElement.textContent = styles.default;
    }
    this.shadowRoot.appendChild(styleElement);

    // 创建容器
    this.mountPoint = document.createElement('div');
    this.mountPoint.className = 'cwd-comments-container';
    this.shadowRoot.appendChild(this.mountPoint);

    // 设置主题
    if (this.config.theme) {
      this.mountPoint.setAttribute('data-theme', this.config.theme);
    }

    // 创建 API 客户端和 Store
    const api = createApiClient(this.config);
    this.store = createCommentStore(
      this.config,
      api.fetchComments.bind(api),
      api.submitComment.bind(api)
    );

    // 订阅状态变化
    this.unsubscribe = this.store.store.subscribe((state) => {
      this._onStateChange(state);
    });

    // 渲染组件
    this._render();

    // 加载评论
    this.store.loadComments();

    this._mounted = true;
  }

  /**
   * 卸载组件
   */
  unmount() {
    if (!this._mounted) {
      return;
    }

    // 销毁组件
    if (this.commentForm) {
      this.commentForm.destroy();
      this.commentForm = null;
    }

    if (this.commentList) {
      this.commentList.destroy();
      this.commentList = null;
    }

    // 取消订阅
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // 移除 Shadow DOM - 通过替换所有子节点
    if (this.hostElement) {
      // Shadow DOM 会在清空子节点时自动移除
      while (this.hostElement.firstChild) {
        this.hostElement.removeChild(this.hostElement.firstChild);
      }
    }

    this.shadowRoot = null;
    this.mountPoint = null;
    this.store = null;
    this._mounted = false;

    console.log('[CWDComments] 组件已卸载');
  }

  /**
   * 渲染组件
   * @private
   */
  _render() {
    if (!this.mountPoint) {
      return;
    }

    const state = this.store.store.getState();

    // 创建评论表单
    if (!this.commentForm) {
      this.commentForm = new CommentForm(this.mountPoint, {
        form: state.form,
        formErrors: state.formErrors,
        submitting: state.submitting,
        onSubmit: () => this._handleSubmit(),
        onFieldChange: (field, value) => this.store.updateFormField(field, value)
      });
      this.commentForm.render();
    }

    // 创建错误提示
    const existingError = this.mountPoint.querySelector('.cwd-error-inline');
    if (state.error) {
      if (!existingError) {
        const errorEl = document.createElement('div');
        errorEl.className = 'cwd-error-inline';
        errorEl.innerHTML = `
          <span>${state.error}</span>
          <button type="button" class="cwd-error-close" data-action="clear-error">✕</button>
        `;
        errorEl.querySelector('[data-action="clear-error"]').addEventListener('click', () => {
          this.store.clearError();
        });
        this.mountPoint.insertBefore(errorEl, this.mountPoint.firstChild);
      }
    } else if (existingError) {
      existingError.remove();
    }

    // 创建头部统计
    let header = this.mountPoint.querySelector('.cwd-comments-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'cwd-comments-header';
      header.innerHTML = `
        <h3 class="cwd-comments-count">
          共 <span class="cwd-comments-count-number">0</span> 条评论
        </h3>
      `;
      this.mountPoint.appendChild(header);
    }
    const countEl = header.querySelector('.cwd-comments-count-number');
    if (countEl) {
      countEl.textContent = state.pagination.totalCount;
    }

    // 创建评论列表
    if (!this.commentList) {
      const listContainer = document.createElement('div');
      this.mountPoint.appendChild(listContainer);

      this.commentList = new CommentList(listContainer, {
        comments: state.comments,
        loading: state.loading,
        error: null,
        currentPage: state.pagination.page,
        totalPages: this.store.getTotalPages(),
        replyingTo: state.replyingTo,
        replyContent: state.replyContent,
        replyError: state.replyError,
        submitting: state.submitting,
        adminEmail: this.config.adminEmail,
        adminBadge: this.config.adminBadge || '博主',
        onRetry: () => this.store.loadComments(),
        onReply: (commentId) => this.store.startReply(commentId),
        onSubmitReply: (commentId) => this.store.submitReply(commentId),
        onCancelReply: () => this.store.cancelReply(),
        onUpdateReplyContent: (content) => this.store.updateReplyContent(content),
        onClearReplyError: () => this.store.clearReplyError(),
        onPrevPage: () => this.store.goToPage(state.pagination.page - 1),
        onNextPage: () => this.store.goToPage(state.pagination.page + 1),
        onGoToPage: (page) => this.store.goToPage(page)
      });
      this.commentList.render();
    }
  }

  /**
   * 状态变化处理
   * @private
   */
  _onStateChange(state, prevState) {
    if (!this._mounted) {
      return;
    }

    // 根据回复状态显示/隐藏主评论表单
    if (this.commentForm?.elements?.root) {
      const formRoot = this.commentForm.elements.root;
      if (state.replyingTo !== null) {
        formRoot.style.display = 'none';
      } else {
        formRoot.style.display = '';
      }
    }

    // 更新评论表单
    if (this.commentForm) {
      this.commentForm.setProps({
        form: state.form,
        formErrors: state.formErrors,
        submitting: state.submitting
      });
    }

    // 更新错误提示
    const existingError = this.mountPoint?.querySelector('.cwd-error-inline');
    if (state.error) {
      if (!existingError) {
        const errorEl = document.createElement('div');
        errorEl.className = 'cwd-error-inline';
        errorEl.innerHTML = `
          <span>${state.error}</span>
          <button type="button" class="cwd-error-close" data-action="clear-error">✕</button>
        `;
        errorEl.querySelector('[data-action="clear-error"]').addEventListener('click', () => {
          this.store.clearError();
        });
        this.mountPoint?.insertBefore(errorEl, this.mountPoint.firstChild);
      }
    } else if (existingError) {
      existingError.remove();
    }

    // 更新头部统计
    const header = this.mountPoint?.querySelector('.cwd-comments-header');
    const countEl = header?.querySelector('.cwd-comments-count-number');
    if (countEl) {
      countEl.textContent = state.pagination.totalCount;
    }

    // 更新评论列表
    if (this.commentList) {
      this.commentList.setProps({
        comments: state.comments,
        loading: state.loading,
        currentPage: state.pagination.page,
        totalPages: this.store.getTotalPages(),
        replyingTo: state.replyingTo,
        replyContent: state.replyContent,
        replyError: state.replyError,
        submitting: state.submitting
      });
    }
  }

  /**
   * 处理评论提交
   * @private
   */
  async _handleSubmit() {
    const success = await this.store.submitNewComment();
    if (success) {
      // 表单内容已在 store 中清空
      // 更新表单组件
      if (this.commentForm) {
        this.commentForm.state.localForm = { ...this.store.store.getState().form };
      }
    }
  }

  /**
   * 更新配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    const prevConfig = { ...this.config };

    Object.assign(this.config, newConfig);

    // 更新主题
    if (newConfig.theme && this.mountPoint) {
      this.mountPoint.setAttribute('data-theme', newConfig.theme);
    }

    // 如果 postSlug 变化，重新加载评论
    if (newConfig.postSlug && newConfig.postSlug !== prevConfig.postSlug) {
      // 重新创建 API 客户端和 Store
      const api = createApiClient(this.config);

      // 取消旧订阅
      if (this.unsubscribe) {
        this.unsubscribe();
      }

      // 创建新 store
      this.store = createCommentStore(
        this.config,
        api.fetchComments.bind(api),
        api.submitComment.bind(api)
      );

      // 重新订阅
      this.unsubscribe = this.store.store.subscribe((state) => {
        this._onStateChange(state);
      });

      // 加载评论
      this.store.loadComments();
    }
  }

  /**
   * 获取当前配置
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }

}
