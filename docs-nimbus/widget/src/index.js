/**
 * Momo Comments Widget 入口文件
 *
 * 使用方法：
 * ```html
 * <div id="comments"></div>
 * <script src="cwd.js"></script>
 * <script>
 *   new CWDComments({
 *     el: '#comments',
 *     apiBaseUrl: 'https://api.example.com'
 *   }).mount();
 * </script>
 * ```
 */

import { CWDComments } from './core/CWDComments.js';

// 导出为全局变量（用于 UMD 构建）
if (typeof window !== 'undefined') {
  window.CWDComments = CWDComments;
}

// ES Module 默认导出
export default CWDComments;
export { CWDComments };
