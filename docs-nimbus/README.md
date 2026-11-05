# CWD 文档 · Nimbus

这是 CWD 当前维护和部署的正式文档站，使用 Nimbus 和 Astro 渲染。文档和 Widget 源码统一在本目录维护；根目录 `docs/` 仅保留为旧 VitePress 版本的迁移参考。GitHub Actions 通过 `.github/workflows/docs.yml` 构建本目录，并将 `docs-nimbus/dist/` 发布到 `gh-pages` 分支；`.github/workflows/npm_publish.yml` 从 `docs-nimbus/widget/` 构建并发布 npm 包。

## 本地查看

需要 Node.js 22.12 或更高版本。在本目录中执行：

```bash
npm install
npm run dev
```

打开 http://127.0.0.1:4321/ 查看文档。完整搜索索引在构建时生成，体验搜索请执行：

```bash
npm run build
npm run preview
```

`npm run dev` 会先自动安装并构建本目录的 Widget，再将 `cwd.js` 和表情资源复制到 `public/`。修改 Widget 源码后，重新运行 `npm run dev` 即可更新预览。

## 完整构建

在本目录执行 `npm run build`，会依次完成：

1. `npm run build:widget`：安装 `widget/` 的依赖并构建 Widget，生成 `widget/dist/cwd.js`。
2. `npm run build:docs`：构建 Nimbus 文档到 `dist/`。
3. `node build.js dist`：将最新 `cwd.js` 和仓库根目录的 `emotion/` 复制到 `dist/`。

部署整个 `dist/` 即可同时发布文档、`/cwd.js` 和 `/emotion/`。任一步失败都会终止完整构建。开发时生成的 `public/cwd.js`、`public/emotion/` 及所有构建产物均已忽略，不应提交。

GitHub Pages 从 `gh-pages` 分支的根目录发布。工作流通过 `cname: cwd.js.org` 在每次部署时生成并保留 `CNAME` 文件，避免替换发布产物后丢失自定义域名。更换域名时，需要同步修改工作流的 `cname`、`astro.config.ts` 的 `site` 和仓库 Pages 设置。

## 目录说明

- `src/content/docs/`：正式文档内容，保留 `guide/`、`function/`、`config/`、`api/` 路径。
- `public/`：站点使用的图标和截图。
- `widget/`：评论组件的维护和 npm 发布源码，供本站构建 `/cwd.js`。
- `build.js`：将 Widget 产物和根目录表情资源复制到 `public/` 或 `dist/`。
- `astro.config.ts`：站点信息和中文栏目顺序。
- `src/components/`、`src/layouts/`、`src/styles/`：Nimbus 官方脚手架生成的组件、布局和样式。

适配内容包括页面标题 frontmatter、提示框、文档链接与首页功能卡片；首页采用无侧栏的宽布局，文档内页保留侧栏和阅读宽度。后续文档和 Widget 改动直接修改本目录，不再同步到旧 `docs/` 副本。

顶部主导航的站内链接在当前标签页跳转；外部链接显示右上箭头，并在新标签页打开。

页眉、移动导航和分享卡片统一使用项目自带的 `public/icon.png`。浏览器标签页使用同一图片的 `public/favicon.png` 副本，由 Nimbus 自动识别；不保留脚手架默认的 SVG 和 ICO 图标。

## 旧链接兼容

构建会为文档内页生成旧 VitePress 地址的跳转页，例如 `/guide/getting-started.html` 跳转到 `/guide/getting-started`。这些实际的 `.html` 文件可以直接部署到 GitHub Pages，无需服务器重写规则，也不依赖旧 `docs/` 目录。

启用 JavaScript 时，跳转保留查询参数和锚点，并替换当前历史记录；禁用 JavaScript 时仍有自动跳转和可点击的新地址。新站会在旧锚点无法直接定位时，忽略标点和分隔符差异，尝试滚动到唯一匹配的正文标题。首页继续由已有 `index.html` 提供。

## Widget 测试

在 `widget/` 中执行 `npm test`，使用 Node.js 内置测试运行器运行从旧目录保留的 3 个测试文件，覆盖 API 错误处理、表情处理和 Turnstile 生命周期。修改组件后同时执行 `npm run build` 验证发布产物。

## 评论系统

首页和文档内页加载本站构建生成的 `/cwd.js`（自动兼容 Astro 的 `base` 路径），API 地址为 `https://cwd-api.zishu.me`，站点标识为 `cwd-doc`。配置集中在 `src/components/comments.client.ts`。表情目录随站点发布，挂件实际采用的表情地址仍由评论后台配置决定。

评论区位于“上一页 / 下一页”下方。内页使用原 VitePress 的 `.html` 路径作为 `postSlug`，首页使用 `/`，以便读取原文档对应页面的评论。评论主题随站点切换，Astro 页面跳转前会卸载旧实例，跳转完成后按新页面的 `postSlug` 重新加载评论；前进、后退也会执行相同流程。加载失败时可点击“重新加载”。

线上评论服务仍执行原有的域名白名单、审核和人机验证规则。目前允许的域名为 `zishu.me` 和 `cwd.js.org`（含子域名），本地 `127.0.0.1` 或 `localhost` 会显示挂件的未授权提示。需要本地完整交互时，应在评论后台明确配置允许的开发域名，并按 Turnstile 要求配置开发环境。

站点地址配置为 `https://cwd.js.org`，本地预览仍使用上面的 `127.0.0.1:4321`；部署到其他域名时需修改 `astro.config.ts` 中的 `site`。构建结果位于本目录 `dist/`，由 GitHub Actions 发布到 `gh-pages` 分支。
