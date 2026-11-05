# AGENTS.md

## 项目结构

- 根目录只放仓库元信息；没有统一的安装、运行、测试脚本，不要在根目录执行业务构建命令。
- `cwd-api/` 是 Cloudflare Workers + Hono + D1 后端。路由入口在 `src/index.ts`，接口处理器在 `src/api/**`，共享工具在 `src/utils/**`，D1 表结构在 `schemas/comment.sql`，Wrangler 配置示例是 `wrangler.jsonc.example`。
- `cwd-admin/` 是 Vue 3 + Vite 后台。页面在 `src/views/**`，接口封装在 `src/api/**`，全局样式在 `src/styles/**`，多语言文案在 `src/locales/*.json`。
- `docs-nimbus/` 是当前维护和部署的 Nimbus + Astro 文档站。文档内容在 `src/content/docs/**/*.mdx`，站点配置在 `astro.config.ts`，静态资源复制脚本是 `build.js`；构建产物在 `dist/`。
- `docs-nimbus/widget/` 是当前维护和发布到 npm 的评论组件包。核心逻辑在 `src/core/**`，组件在 `src/components/**`，样式在 `src/styles/**`，语言包在 `src/locales/**`。
- `docs/` 是保留作迁移参考的旧 VitePress 文档及 Widget 副本，后续文档和组件改动以 `docs-nimbus/` 为准；当前发布流程不再依赖该目录。

## 运行命令

- 后端本地运行：`cd cwd-api && pnpm install && pnpm dev`。首次运行前根据 `wrangler.jsonc.example` 准备 `wrangler.jsonc`。
- 后端类型生成：`cd cwd-api && pnpm cf-typegen`。
- 后台本地运行：`cd cwd-admin && npm install && npm run dev`。
- 后台构建：`cd cwd-admin && npm run build`。
- 文档本地运行：`cd docs-nimbus && npm install && npm run dev`，需要 Node.js 22.12 或更高版本。
- 文档完整构建：`cd docs-nimbus && npm run build`；该命令会进入 `widget/` 安装依赖并构建组件，然后构建文档和复制发布资源。
- 文档预览：`cd docs-nimbus && npm run preview`。
- Widget 单独运行：`cd docs-nimbus/widget && npm install && npm run dev`。
- Widget 单独构建：`cd docs-nimbus/widget && npm run build`。

## 测试命令

- 后端测试：`cd cwd-api && pnpm test`。测试使用 `@cloudflare/vitest-pool-workers`，依赖 `wrangler.jsonc`。
- 后端改动必须补充或更新相邻的 `*.spec.ts`；现有测试位置参考 `cwd-api/src/api/**/*.spec.ts`。
- Widget 测试：`cd docs-nimbus/widget && npm test`，使用 Node.js 内置测试运行器，覆盖 API 错误、表情处理和 Turnstile 生命周期。
- `cwd-admin` 和 `docs-nimbus` 当前没有测试脚本；相关改动至少运行对应的 `npm run build`。Widget 改动运行 `npm test` 和 `npm run build`。
- 纯文档或本文件改动无需运行测试，但要确认 Markdown 内容和命令路径准确。

## 代码风格

- 遵守根目录 `.prettierrc`：`printWidth: 140`、`useTabs: true`、`tabWidth: 2`、分号、单引号、`trailingComma: es5`、LF 换行。
- TypeScript 使用严格类型；新增接口、事件、函数、方法时尽量补 JSDoc。只在外部输入边界或测试 mock 中使用 `any`，业务逻辑中优先定义明确类型。
- 后端接口继续使用 Hono `Context<{ Bindings: Bindings }>`，数据库访问必须用 D1 `prepare(...).bind(...)`，不要拼接用户输入到 SQL。
- 后端处理用户内容时必须保持 XSS 防护；Markdown、HTML、邮箱、域名、IP、管理员密钥等输入变更要显式校验。
- 后端新增配置项时，同步考虑 `Settings` 读写、导入导出、备份迁移、后台接口和文档。
- Vue 后台改 UI 文案时必须走 `vue-i18n`，新增 key 要同步所有 `cwd-admin/src/locales/*.json`。
- Widget 改可见文案时同步 `docs-nimbus/widget/src/locales/**`；公共 API 变更要同步 `docs-nimbus/widget/src/index.d.ts`、`package.json` 导出和文档。
- 样式按所在子项目现有组织维护：后台优先改 `cwd-admin/src/styles/**`，Widget 优先改 `docs-nimbus/widget/src/styles/**`，避免散落内联样式。

## 禁止事项

- 不要在根目录新增依赖或臆造根级 workspace 脚本。
- 不要提交 `node_modules/`、构建产物、Cloudflare 密钥、真实 `wrangler.jsonc` 中的敏感配置。
- 不要直接修改发布产物；应修改源文件后通过对应 build 生成。
- 不要绕过鉴权、管理员密钥、评论审核、域名限制、IP/邮箱封禁、CORS、XSS 过滤等安全逻辑。
- 不要为了前端显示方便改变后端字段语义；接口字段改动必须兼容后台、Widget、文档和测试。
- 不要删除或跳过现有迁移、备份、导入导出逻辑，除非同时给出兼容方案和验证。
- 不要把用户可控内容写入 `v-html`、`innerHTML` 或模板字符串 HTML，除非已经经过现有净化流程。

## 完成标准

- 改动范围和用户需求一致，没有顺手重构无关模块。
- 受影响子项目的测试或构建已运行；无法运行时说明原因、缺失前置条件和未验证风险。
- 后端行为改动有相邻 Vitest 覆盖，至少覆盖成功路径和关键失败路径。
- 前端可见行为改动已验证桌面和窄屏布局，不出现文本溢出、控件遮挡或无效交互。
- API、配置、环境变量、部署步骤或用户可见功能变化已同步文档。
- 新增公开类型、函数、方法、事件、接口时有简洁 JSDoc，说明参数、返回值或副作用。

## Review 标准

- 优先检查安全：鉴权、输入校验、SQL 绑定、XSS、CORS、敏感信息、权限边界。
- 检查兼容性：Cloudflare Workers 运行时、D1/KV/R2 绑定、现有 API 字段、Widget 公共包导出、后台多语言。
- 检查数据影响：迁移是否幂等，导入导出和备份是否保留字段，旧数据是否能读取。
- 检查测试有效性：测试是否真实覆盖改动路径，是否只验证 mock 调用而没有验证行为结果。
- 检查前端质量：加载、空状态、错误状态、分页、窄屏、长文本、多语言长度和暗色主题。
- 检查依赖：新增依赖必须有明确必要性，不能用大依赖替代少量本地逻辑。
