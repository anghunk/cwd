/**
 * DOM 操作工具函数
 */

/**
 * 创建元素
 * @param {string} tag - 标签名
 * @param {string} className - 类名
 * @param {Object} attributes - 属性对象，支持 onClick 等事件监听器
 * @param {string|HTMLElement|HTMLElement[]} content - 内容
 * @returns {HTMLElement}
 */
export function createElement(tag, className = '', attributes = {}, content = null) {
  const el = document.createElement(tag);

  if (className) {
    el.className = className;
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith('on')) {
      // 事件监听器，如 onClick -> click
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, value);
    } else if (key === 'dataset') {
      // 设置 data-* 属性
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        el.dataset[dataKey] = dataValue;
      });
    } else {
      el.setAttribute(key, value);
    }
  });

  // 处理内容
  if (content !== null) {
    appendContent(el, content);
  }

  return el;
}

/**
 * 添加内容到元素
 * @param {HTMLElement} el - 目标元素
 * @param {string|HTMLElement|HTMLElement[]} content - 内容
 */
export function appendContent(el, content) {
  if (typeof content === 'string') {
    el.textContent = content;
  } else if (Array.isArray(content)) {
    content.forEach(child => {
      if (child instanceof HTMLElement) {
        el.appendChild(child);
      }
    });
  } else if (content instanceof HTMLElement) {
    el.appendChild(content);
  }
}

/**
 * 设置元素的 HTML 内容
 * @param {HTMLElement} el - 目标元素
 * @param {string} html - HTML 字符串
 */
export function setHTML(el, html) {
  el.innerHTML = html;
}

/**
 * 清空元素内容
 * @param {HTMLElement} el - 目标元素
 */
export function empty(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * 显示元素
 * @param {HTMLElement} el - 目标元素
 */
export function show(el) {
  el.style.display = '';
}

/**
 * 隐藏元素
 * @param {HTMLElement} el - 目标元素
 */
export function hide(el) {
  el.style.display = 'none';
}

/**
 * 切换元素显示状态
 * @param {HTMLElement} el - 目标元素
 * @param {boolean} visible - 是否显示
 */
export function toggle(el, visible) {
  if (visible) {
    show(el);
  } else {
    hide(el);
  }
}

/**
 * 添加类名
 * @param {HTMLElement} el - 目标元素
 * @param {string} className - 类名
 */
export function addClass(el, className) {
  el.classList.add(className);
}

/**
 * 移除类名
 * @param {HTMLElement} el - 目标元素
 * @param {string} className - 类名
 */
export function removeClass(el, className) {
  el.classList.remove(className);
}

/**
 * 切换类名
 * @param {HTMLElement} el - 目标元素
 * @param {string} className - 类名
 * @param {boolean} force - 强制添加或移除
 */
export function toggleClass(el, className, force) {
  el.classList.toggle(className, force);
}

/**
 * 查找元素
 * @param {string|HTMLElement} selector - 选择器或元素
 * @param {HTMLElement} context - 上下文元素
 * @returns {HTMLElement|null}
 */
export function query(selector, context = document) {
  if (typeof selector === 'string') {
    return context.querySelector(selector);
  }
  return selector;
}

/**
 * 查找所有元素
 * @param {string} selector - 选择器
 * @param {HTMLElement} context - 上下文元素
 * @returns {NodeList}
 */
export function queryAll(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * 委托事件监听
 * @param {HTMLElement} el - 目标元素
 * @param {string} event - 事件名
 * @param {string} selector - 选择器
 * @param {Function} handler - 处理函数
 */
export function delegate(el, event, selector, handler) {
  el.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && el.contains(target)) {
      handler.call(target, e);
    }
  });
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间
 * @returns {Function}
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
