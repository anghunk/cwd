# 后端配置

## 部署条件

* 拥有一个 Cloudflare 账号（使用邮箱即可注册，[官网地址](https://www.cloudflare.com/)）
* 拥有一个 Node.js 运行环境，版本 >= 22（本地部署需要）
* 拥有一个域名并托管在 Cloudflare 上（这个不是必须项，但可以提高国内访问速度，也更方便）

后端项目目录为 `cwd-comments-api/`，基于 Cloudflare Workers + D1 + KV 实现。

## 部署

**以下部署指令均在该目录下执行，不在根目录下**

```
cd cwd-comments-api
```

### 本地部署

#### 1. 下载代码，安装依赖

可以直接克隆仓库代码

```
npm install
```

#### 2. 配置 Cloudflare Workers

对于 D1 和 KV 配置，有两种方法，第一种是直接使用命令行配置，第二种是使用网页面板创建后填写配置文件，这里推荐使用第一种方法。如果想要使用之前 Cloudflare 上面已经创建的数据库，可以选择自行配置 `wrangler.jsonc` 文件。

下面介绍第一种方法。

* **登录到 Cloudflare**
  ```bash
  npx wrangler login
  ```

* **创建数据库和数据库表**，如果遇到提示，请按回车继续

  ```bash
  npx wrangler d1 create CWD_DB
  npx wrangler d1 execute CWD_DB --remote --file=./schemas/comment.sql
  ```

  运行完成后可以确认一下 `wrangler.jsonc` 中是否有如下配置
  
  ```jsonc
  "d1_databases": [
      {
          "binding": "CWD_DB",
          "database_name": "CWD_DB",
          "database_id": "xxxxxx" // D1 数据库 ID
      }
  ]
  ```

  如果`binding`字段不是`CWD_DB`，请修改为`CWD_DB`

* **创建 KV 存储**，如果遇到提示，按回车继续

  ```bash
  npx wrangler kv namespace create CWD_AUTH_KV
  ```

  运行完成后可以确认一下 `wrangler.jsonc` 中是否有如下配置

  ```jsonc
  "kv_namespaces": [
      {
          "binding": "CWD_AUTH_KV",
          "id": "xxxxxxx" // KV 存储 ID
      }
  ]
  ```

* **部署上线**

  ```bash
  npm run deploy
  ```

没有异常报错后，可以进入 Cloudflare Workers 面板查看是否部署成功，若显示存在一个名称为 `cwd-comments-api` 的项目即推送成功。

#### 3. 配置环境变量

* 登录 Worker 面板，点击项目右侧的 Settings (设置) 选项卡，选择`查看设置`
* 点击变量和机密右侧的添加按钮，给项目添加环境变量，环境变量[参考](#环境变量)
* 部署生效：点击底部的 Save and deploy (保存并部署)。

#### 4. 检测部署情况

部署成功后回得到一个域名，即为后端的域名（格式一般为`https://cwd-comments-api.xxx.workers.dev`。访问该域名，如果显示部署成功页面，说明 API 部署成功，可以到管理后台进行登录。

当然也可以使用自定义域名。

## 服务启动与运行参数

### 本地开发

在本地开发阶段，可以通过 `wrangler dev` 启动本地 Worker：

```bash
npm run dev
# 等价于
wrangler dev
```

常用参数：

- `--port <number>`：指定本地开发端口，例如：

  ```bash
  wrangler dev --port 8788
  ```

  如果你使用评论组件开发页面（`widget/`）进行联调，可以将前端中的 `apiBaseUrl` 配置为：

  ```text
  http://localhost:8788
  ```

- `--env <name>`：指定 wrangler 环境（如有配置多环境）。

> 注意：线上环境的运行参数完全由 Cloudflare Workers 控制，一般无需额外手动配置，只需在控制台或 `wrangler.jsonc` 中正确配置绑定和变量。

## 数据库与 KV 连接配置

后端使用 Cloudflare D1 作为数据库，使用 KV 作为会话存储。

### D1 数据库

1. 创建数据库和表结构：

   ```bash
   npx wrangler d1 create CWD_DB
   npx wrangler d1 execute CWD_DB --remote --file=./schemas/comment.sql
   ```

2. 在 `wrangler.jsonc` 中确保存在如下配置：

   ```jsonc
   "d1_databases": [
     {
       "binding": "CWD_DB",
       "database_name": "CWD_DB",
       "database_id": "xxxxxx"
     }
   ]
   ```

   其中：

   - `binding` 必须为 `CWD_DB`，与代码中的 `env.CWD_DB` 一致。
   - `database_name` 和 `database_id` 根据 Cloudflare 实际创建结果填写。

数据库结构定义见 [`schemas/comment.sql`](../../cwd-comments-api/schemas/comment.sql)。

### KV 存储

1. 创建 KV 命名空间：

   ```bash
   npx wrangler kv namespace create CWD_AUTH_KV
   ```

2. 在 `wrangler.jsonc` 中添加：

   ```jsonc
   "kv_namespaces": [
     {
       "binding": "CWD_AUTH_KV",
       "id": "xxxxxxx"
     }
   ]
   ```

   其中：

   - `binding` 必须为 `CWD_AUTH_KV`，与代码中的 `env.CWD_AUTH_KV` 一致。

KV 主要用于：

- 管理员登录 Token 存储与校验
- 登录失败次数和封禁状态记录

## 环境变量与绑定

后端通过 Cloudflare Worker 的绑定和环境变量控制行为，类型定义见 [`cwd-comments-api/src/bindings.ts`](../../cwd-comments-api/src/bindings.ts)。

所需环境变量如下表所示。

| 名称              | 类型        | 描述                                                                 |
| ----------------- | ----------- | -------------------------------------------------------------------- |
| `CWD_DB`          | D1 绑定     | 评论数据存储数据库                                                   |
| `CWD_AUTH_KV`     | KV 绑定     | 管理员登录 Token、登录尝试计数等                                     |
| `ALLOW_ORIGIN`    | string      | 预留的允许跨域来源配置，目前实现中仍使用 `*`                        |
| `CF_FROM_EMAIL`   | string      | 作为发件人显示的邮箱地址（需在 Cloudflare Email 路由中预先配置）选填 |
| `SEND_EMAIL`      | send_email  | Cloudflare Email 发送绑定，供通知邮件使用                             |
| `ADMIN_NAME`      | string      | 管理员登录名称                                                       |
| `ADMIN_PASSWORD`  | string      | 管理员登录密码                                                       |

在 Cloudflare 控制台中配置方式：

- 打开 Worker 项目 -> `Settings` -> `Variables`
- 在 `Environment Variables` 中添加 `ADMIN_NAME`、`ADMIN_PASSWORD` 等变量
- 在 `D1 Databases` 中绑定 `CWD_DB`
- 在 `KV Namespaces` 中绑定 `CWD_AUTH_KV`
- 在 `Email` 中绑定 `SEND_EMAIL`（如需启用邮件通知）

**注：** 需要在 Cloudflare 控制面板中为 Email 路由开启发送权限并配置发件人域和地址，并在 `wrangler.jsonc` 中为 Worker 添加 `send_email` 绑定，以便在代码中通过 `env.SEND_EMAIL.send()` 直接发信。

## 发信设置

手动在 `wrangler.jsonc` 中添加 `send_email` 绑定，以便在代码中通过 `env.SEND_EMAIL.send()` 直接发信。

```jsonc
{
  ...
  "send_email": [
    {
      "name": "SEND_EMAIL"
    }
  ],
  ...
}
```

参数 `CF_FROM_EMAIL` 这里填写的邮箱是你绑定域名后创建的 Email 路由，两者需保持一致。

## 中间件配置说明

后端使用 Hono 框架，在入口文件中统一配置了 CORS 和管理员认证中间件。

入口文件位置：[`cwd-comments-api/src/index.ts`](../../cwd-comments-api/src/index.ts)

### CORS 中间件

当前实现位于 [`cwd-comments-api/src/utils/cors.ts`](../../cwd-comments-api/src/utils/cors.ts)，对 `/api/*` 和 `/admin/*` 路径统一应用：

- 允许来源：`*`
- 允许方法：`GET, POST, PUT, DELETE, OPTIONS`
- 允许请求头：`Content-Type, Authorization`
- 暴露响应头：`Content-Length`
- 不允许携带凭证（`credentials: false`）

这意味着：

- 评论组件和管理后台可以在任意域名下通过 HTTP 调用后端接口，无需浏览器端额外跨域配置。
- 由于不允许跨域携带 Cookie，认证完全通过 `Authorization: Bearer <token>` 头完成。

代码中预留了 `ALLOW_ORIGIN` 绑定，目前默认行为是允许所有来源。如果你有严格的安全需求，可以在此基础上自定义 CORS 逻辑，将 `origin` 收紧到指定域名。

### 管理员认证中间件

管理员认证中间件位于 [`cwd-comments-api/src/utils/auth.ts`](../../cwd-comments-api/src/utils/auth.ts)，对 `/admin/*` 路径统一生效（登录接口除外）：

- 从请求头 `Authorization` 中解析 Bearer Token。
- 在 `CWD_AUTH_KV` 中校验 `token:<key>` 对应的会话信息。
- Token 由 `/admin/login` 接口生成，有效期为 24 小时。

认证失败时返回：

- 状态码：`401`
- 响应体：`{ "message": "Unauthorized" }` 或 `Token expired or invalid`

## 日志配置与规范

后端主要通过 `console.log` 输出结构化日志，便于在 Cloudflare 控制台或日志采集系统中查看。

### 请求级别日志

在入口中为所有请求记录起止日志：

- `Request:start`：
  - `method`：HTTP 方法
  - `path`：请求路径
  - `url`：完整 URL
  - `hasDb`：是否成功注入 D1 绑定
  - `hasAuthKv`：是否成功注入 KV 绑定
- `Request:end`：
  - `method`：HTTP 方法
  - `path`：请求路径

### 业务级别日志

示例（评论提交流程）：

- `PostComment:request`：记录 `postSlug`、是否为回复、邮箱是否存在、IP 等信息。
- `PostComment:inserted`：记录评论已写入数据库。
- `PostComment:mailDispatch:*`：记录邮件通知相关流程和限流结果。

错误情况：

- 统一使用 `console.error` 输出错误对象，例如邮件发送失败或数据库写入异常。

### 日志使用建议

- 不在日志中输出管理员密码、完整 Token 等敏感信息。
- 如果接入外部日志系统，可以基于日志前缀（如 `Request:*`、`PostComment:*`）做过滤和告警。
- 在调试阶段可以保留日志，生产环境如需减少日志量，可根据需要在代码中调整输出。
