# CWD 文档 · Nimbus 预览

这是从根目录 `docs/` 复制并适配的独立文档站，使用 Nimbus 和 Astro 渲染。原有 VitePress 文档保留在 `docs/`，GitHub Actions 通过 `.github/workflows/docs.yml` 构建本目录，并将 `docs-nimbus/dist/` 发布到 `gh-pages` 分支。

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

## 目录说明

- `src/content/docs/`：原文档的副本，保留 `guide/`、`function/`、`config/`、`api/` 路径。
- `public/`：从原文档复制的图标和截图。
- `widget/`：原 `docs/widget/` 的独立源码副本，供 Nimbus 构建；后续不会自动同步原目录的改动。
- `build.js`：将 Widget 产物和根目录表情资源复制到 `public/` 或 `dist/`。
- `astro.config.ts`：站点信息和中文栏目顺序。
- `src/components/`、`src/layouts/`、`src/styles/`：Nimbus 官方脚手架生成的组件、布局和样式。

适配内容包括页面标题 frontmatter、提示框、文档链接与首页功能卡片；首页采用无侧栏的宽布局，文档内页保留侧栏和阅读宽度。后续修改此副本不会自动同步到 `docs/`。

顶部主导航的站内链接在当前标签页跳转；外部链接显示右上箭头，并在新标签页打开。

页眉、移动导航和分享卡片统一使用项目自带的 `public/icon.png`（与 `docs/public/icon.png` 相同）。浏览器标签页使用同一图片的 `public/favicon.png` 副本，由 Nimbus 自动识别；不保留脚手架默认的 SVG 和 ICO 图标。

## 评论系统

首页和文档内页加载本站构建生成的 `/cwd.js`（自动兼容 Astro 的 `base` 路径），API 地址为 `https://cwd-api.zishu.me`，站点标识为 `cwd-doc`。配置集中在 `src/components/comments.client.ts`。表情目录随站点发布，挂件实际采用的表情地址仍由评论后台配置决定。

评论区位于“上一页 / 下一页”下方。内页使用原 VitePress 的 `.html` 路径作为 `postSlug`，首页使用 `/`，以便读取原文档对应页面的评论。评论主题随站点切换，Astro 页面跳转前会卸载旧实例，跳转完成后按新页面的 `postSlug` 重新加载评论；前进、后退也会执行相同流程。加载失败时可点击“重新加载”。

线上评论服务仍执行原有的域名白名单、审核和人机验证规则。目前允许的域名为 `zishu.me` 和 `cwd.js.org`（含子域名），本地 `127.0.0.1` 或 `localhost` 会显示挂件的未授权提示。需要本地完整交互时，应在评论后台明确配置允许的开发域名，并按 Turnstile 要求配置开发环境。

站点地址配置为 `https://cwd.js.org`，本地预览仍使用上面的 `127.0.0.1:4321`；部署到其他域名时需修改 `astro.config.ts` 中的 `site`。构建结果位于本目录 `dist/`，由 GitHub Actions 发布到 `gh-pages` 分支。
