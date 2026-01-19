# 后端配置

## 部署条件

* 拥有一个 Cloudflare 账号（使用邮箱即可注册，[官网地址](https://www.cloudflare.com/)）
* 拥有一个 Node.js 运行环境，版本 >= 22（本地部署需要）
* 拥有一个域名并托管在 Cloudflare 上（这个不是必须项，但可以提高国内访问速度，也更方便）

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

## 环境变量

所需环境变量如下表所示。

| 变量名           | 描述                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `ADMIN_NAME`     | 管理员登录名称                                                       |
| `ADMIN_PASSWORD` | 管理员登录密码                                                       |
| `CF_FROM_EMAIL`  | 作为发件人显示的邮箱地址（需在 Cloudflare Email 路由中预先配置）选填 |

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

参数 `CF_FROM_EMAIL` 这里填写的邮箱是你绑定域名后，创建的 email 路由，两者需保持一致
