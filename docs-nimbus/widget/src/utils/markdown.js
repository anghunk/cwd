import { marked } from 'marked';
import DOMPurify from 'dompurify';
import * as emoji from 'node-emoji';

// 配置 marked
try {
  marked.setOptions({
    gfm: true, // 启用 GitHub Flavored Markdown
    breaks: true, // 启用换行符转 <br>
  });
} catch (e) {
  console.error('Failed to configure marked:', e);
}

/**
 * 替换文本中的 emoji 代码为实际 emoji
 * @param {string} text 包含 emoji 代码的文本
 * @returns {string} 替换后的文本
 */
function replaceEmoji(text) {
  if (!text) return text;
  try {
    return emoji.emojify(text);
  } catch (e) {
    return text;
  }
}

/**
 * 替换 HTML 中的 emoji 代码为实际 emoji
 * @param {string} html 包含 emoji 代码的 HTML
 * @returns {string} 替换后的 HTML
 */
export function replaceEmojiInHtml(html) {
  if (!html) return html;
  return replaceEmoji(html);
}

/**
 * 渲染 Markdown 为 HTML，并进行净化
 * @param {string} content Markdown 内容
 * @returns {string} 净化后的 HTML
 */
export function renderMarkdown(content) {
  if (!content) return '';
  try {
    const contentWithEmoji = replaceEmoji(content);
    const html = marked.parse(contentWithEmoji);
    // marked.parse can return a Promise if async is enabled, but we are using sync mode
    // Just in case, handle potential Promise (though unlikely with current config)
    if (html instanceof Promise) {
      console.warn('marked.parse returned a Promise. Async markdown rendering is not fully supported in this sync flow.');
      return '';
    }
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return DOMPurify.sanitize(content); // Fallback to plain text (sanitized)
  }
}
