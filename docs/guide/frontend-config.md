# 前端配置

**这里仅提供一套开箱即用的方案，如果是个人开发者可以根据 API 文档自行编写前端评论组件。**

当前前端部分主要由两块组成：

- 评论组件（widget）：以 UMD 库形式输出 `cwd-comments.js`，可在任意站点中直接通过 `<script>` 引入。
- 管理后台（admin）：基于 Vite + Vue 3 的单页应用，用于管理评论和系统配置。

> 相关 API 文档见：[公开 API](../api/public.md) 和 [管理员 API](../api/admin.md)

## 环境与项目结构

前端目录结构与运行时环境：

- `widget/`：评论组件源码
  - 运行环境：浏览器（支持现代浏览器）
  - 构建工具：Vite
- `cwd-comments-admin/`：管理后台源码
  - 运行环境：浏览器
  - 构建工具：Vite + Vue 3

Node.js 版本建议使用 `>=18`，与后端保持一致即可。

### 环境变量与多环境配置

评论组件本身不依赖打包时的环境变量，只需要在运行时传入 `apiBaseUrl` 即可。  
管理后台使用 Vite 环境变量进行多环境配置，推荐按以下方式区分开发 / 测试 / 生产环境：

在 `cwd-comments-admin` 目录下创建对应的环境文件：

```bash
# 开发环境
cp .env.example .env.development

# 测试环境
cp .env.example .env.test

# 生产环境
cp .env.example .env.production
```

每个环境文件中可配置以下变量：

| 变量名               | 说明                                             | 示例                                |
| -------------------- | ----------------------------------------------- | ----------------------------------- |
| `VITE_API_BASE_URL`  | 后端 API 地址（Cloudflare Worker 域名或自定义） | `https://cwd-comments-api.test.com` |
| `VITE_ADMIN_NAME`    | 登录页默认管理员账号占位值                      | `admin@example.com`                 |
| `VITE_ADMIN_PASSWORD`| 登录页默认密码占位值                            | `123456`                            |

说明：

- `VITE_API_BASE_URL` 会作为管理后台的默认 API 地址，实际请求地址可以在登录页修改，并持久化到 `localStorage`。
- `VITE_ADMIN_NAME` 和 `VITE_ADMIN_PASSWORD` 仅用于自动填充登录表单，真正的认证信息以后端环境变量 `ADMIN_NAME`、`ADMIN_PASSWORD` 为准。

## 依赖安装与启动流程

### 评论组件（widget）

开发和构建评论组件：

```bash
cd widget

# 安装依赖
npm install

# 本地开发预览
npm run dev

# 构建 UMD 库（生成 cwd-comments.js）
npm run build
```

构建完成后，将 `widget/dist/cwd-comments.js` 部署到你的静态资源服务器或 CDN，示例：

```html
<script src="https://static.example.com/cwd-comments/cwd-comments.js"></script>
<div id="comments"></div>
<script>
  const comments = new CWDComments({
    el: '#comments',
    apiBaseUrl: 'https://your-api.example.com',
    postSlug: 'https://example.com/my-post'
  });
  comments.mount();
</script>
```

### 管理后台（cwd-comments-admin）

管理后台用于审核评论、删除评论和管理评论设置。

```bash
cd cwd-comments-admin

# 安装依赖
npm install

# 开发环境启动（默认端口见 vite.config.ts，一般为 1226）
npm run dev

# 生产环境构建
npm run build

# 本地预览生产构建结果
npm run preview
```

将 `cwd-comments-admin/dist` 目录部署到任意静态站点托管服务（如 Cloudflare Pages、Vercel、Netlify 等），并确保浏览器可以访问到后端 API 地址。

## 评论组件初始化

在初始化 `CWDComments` 实例时，可以传入以下配置参数：

```html
<script src="https://cwd-comments.zishu.me/cwd-comments.js"></script>
<div id="comments"></div>
<script>
  const comments = new CWDComments({
    el: '#comments',
    apiBaseUrl: 'https://your-api.example.com',
    postSlug: 'https://example.com/my-post'
  });
  comments.mount();
</script>
```

### 参数说明

| 参数           | 类型                    | 必填 | 默认值                        | 说明                       |
| -------------- | ----------------------- | ---- | ----------------------------- | -------------------------- |
| `el`           | `string \| HTMLElement` | 是   | -                             | 挂载元素选择器或 DOM 元素  |
| `apiBaseUrl`   | `string`                | 是   | -                             | API 基础地址               |
| `postSlug`     | `string`                | 是   | -                             | 文章唯一标识符             |
| `postTitle`    | `string`                | 否   | 页面标题或 `postSlug`         | 文章标题，用于邮件通知     |
| `postUrl`      | `string`                | 否   | 当前页面 URL                  | 文章 URL，用于邮件通知     |
| `theme`        | `'light' \| 'dark'`     | 否   | `'light'`                     | 主题模式                   |
| `pageSize`     | `number`                | 否   | `20`                          | 每页显示评论数             |
| `avatarPrefix` | `string`                | 否   | `https://gravatar.com/avatar` | 头像服务前缀               |
| `adminEmail`   | `string`                | 否   | -                             | 博主邮箱，用于显示博主标识 |
| `adminBadge`   | `string`                | 否   | `博主`                        | 博主标识文字               |

## 跨域访问配置

前端评论组件与管理后台均通过 HTTP 与后端交互。当前后端在 `/api/*` 和 `/admin/*` 路径下统一开启了 CORS：

- `Access-Control-Allow-Origin: *`
- 允许方法：`GET, POST, PUT, DELETE, OPTIONS`
- 允许请求头：`Content-Type, Authorization`
- 不允许携带 Cookie 等凭证（`Access-Control-Allow-Credentials: false`）

因此在常见部署方式下，你只需要在前端将 `apiBaseUrl` 指向后端 Worker 地址即可，无需额外前端跨域配置，例如：

```javascript
const comments = new CWDComments({
  el: '#comments',
  apiBaseUrl: 'https://cwd-comments-api.example.com',
  postSlug: window.location.pathname
});
comments.mount();
```

如果你在本地同时运行前端和后端，可以按以下方式联调：

- 使用 `wrangler dev` 启动后端（默认端口一般为 8787，如有需要可使用 `wrangler dev --port 8788` 指定端口）。
- 在评论组件开发页面（`widget/index.html`）中，将 API 地址设置为对应本地端口，例如 `http://localhost:8787`。

后端关于 CORS 的更详细说明见：[后端配置](./backend-config.md#跨域配置与安全性)。

## 静态资源部署规范

为了保证前端资源加载稳定，建议按如下规范部署静态资源：

- 使用 HTTPS 域名托管 `cwd-comments.js` 以及管理后台构建产物。
- 将评论组件脚本放在具备缓存能力的静态资源域名或 CDN 上，例如：
  - `https://static.example.com/cwd-comments/v0.0.1/cwd-comments.js`
- 当发布新版本时，建议通过路径或文件名中的版本号进行区分，避免缓存错乱。
- 页面中引入脚本时保持路径稳定，便于后续版本升级：

```html
<script src="https://static.example.com/cwd-comments/v0.0.1/cwd-comments.js"></script>
```

管理后台的构建结果同样建议部署到独立的静态站点域名下，例如：

- `https://comments-admin.example.com` 部署 `cwd-comments-admin/dist`

## 头像服务前缀

常用的 Gravatar 镜像服务：

| 服务            | 前缀地址                         |
| --------------- | -------------------------------- |
| Gravatar 官方   | `https://gravatar.com/avatar`    |
| Cravatar (国内) | `https://cravatar.cn/avatar`     |
| 自定义镜像      | `https://your-mirror.com/avatar` |

## 实例方法

| 方法                   | 说明                           |
| ---------------------- | ------------------------------ |
| `mount()`              | 挂载组件到 DOM                 |
| `unmount()`            | 卸载组件                       |
| `updateConfig(config)` | 更新配置（支持动态切换主题等） |
| `getConfig()`          | 获取当前配置                   |

## 使用示例

```javascript
// 动态切换主题
comments.updateConfig({ theme: 'dark' });

// 切换文章
comments.updateConfig({ postSlug: 'another-post' });
```
