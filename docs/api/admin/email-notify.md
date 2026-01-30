# 邮件通知

邮件通知配置接口用于获取和更新 SMTP 配置、邮件模板以及测试邮件发送功能。

新评论的邮件通知会发送到「评论设置」(`/admin/settings/comments`) 中配置的管理员邮箱（`adminEmail`），无需在本接口中单独设置收件邮箱。

所有接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

## 1.1 获取邮件通知配置

```
GET /admin/settings/email-notify
```

获取邮件通知配置，包括 SMTP 配置和邮件模板。

- 方法：`GET`
- 路径：`/admin/settings/email-notify`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
  "globalEnabled": true,
  "smtp": {
    "host": "smtp.qq.com",
    "port": 465,
    "user": "noreply@qq.com",
    "pass": "",
    "secure": true
  },
  "templates": {
    "reply": "回复评论的邮件模板 HTML",
    "admin": "新评论通知的邮件模板 HTML"
  }
}
```

字段说明：

| 字段名         | 类型    | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| `globalEnabled` | boolean | 是否全局启用邮件通知                                           |
| `smtp.host`    | string  | SMTP 服务器地址，默认 `smtp.qq.com`                            |
| `smtp.port`    | number  | SMTP 服务器端口，默认 `465`                                  |
| `smtp.user`    | string  | SMTP 用户名（发件邮箱）                                      |
| `smtp.pass`    | string  | SMTP 密码（脱敏显示，不返回完整密码）                         |
| `smtp.secure`  | boolean | 是否使用 SSL/TLS，默认 `true`                                |
| `templates.reply` | string | 回复评论时的邮件模板，支持变量占位符                          |
| `templates.admin` | string | 新评论通知的邮件模板，支持变量占位符                          |

**邮件模板变量**

回复评论模板（`templates.reply`）支持的变量：

| 变量名            | 说明         |
| ----------------- | ------------ |
| `${toEmail}`      | 收件人邮箱   |
| `${toName}`       | 收件人昵称   |
| `${postTitle}`     | 文章标题     |
| `${parentComment}` | 被回复的评论内容 |
| `${replyAuthor}`   | 回复者昵称   |
| `${replyContent}`  | 回复内容     |
| `${postUrl}`      | 文章链接     |

新评论通知模板（`templates.admin`）支持的变量：

| 变量名            | 说明         |
| ----------------- | ------------ |
| `${postTitle}`     | 文章标题     |
| `${postUrl}`      | 文章链接     |
| `${commentAuthor}` | 评论者昵称   |
| `${commentContent}` | 评论内容     |

**错误响应**

- 状态码：`500`

```json
{
  "message": "错误信息"
}
```

## 1.2 更新邮件通知配置

```
PUT /admin/settings/email-notify
```

更新邮件通知配置，包括 SMTP 配置和邮件模板。

- 方法：`PUT`
- 路径：`/admin/settings/email-notify`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
  "globalEnabled": true,
  "smtp": {
    "host": "smtp.qq.com",
    "port": 465,
    "user": "noreply@qq.com",
    "pass": "your_password",
    "secure": true
  },
  "templates": {
    "reply": "<div>...</div>",
    "admin": "<div>...</div>"
  }
}
```

字段说明：

| 字段名         | 类型    | 必填 | 说明                                                         |
| -------------- | ------- | ---- | ------------------------------------------------------------ |
| `globalEnabled` | boolean | 否   | 是否全局启用邮件通知                                           |
| `smtp`        | object  | 否   | SMTP 配置对象                                                 |
| `smtp.host`    | string  | 否   | SMTP 服务器地址                                               |
| `smtp.port`    | number  | 否   | SMTP 服务器端口                                               |
| `smtp.user`       | string  | 否   | SMTP 用户名（发件邮箱）                                       |
| `smtp.pass`    | string  | 否   | SMTP 密码                                                     |
| `smtp.secure`  | boolean | 否   | 是否使用 SSL/TLS                                              |
| `templates`    | object  | 否   | 邮件模板对象                                                 |
| `templates.reply` | string | 否   | 回复评论的邮件模板 HTML                                        |
| `templates.admin` | string | 否   | 新评论通知的邮件模板 HTML                                      |

**成功响应**

- 状态码：`200`

```json
{
  "message": "保存成功"
}
```

**错误响应**

- 状态码：`500`

```json
{
  "message": "保存失败"
}
```

## 1.3 测试邮件发送

```
POST /admin/settings/email-test
```

测试邮件通知配置是否正确，发送一封测试邮件到指定邮箱。

- 方法：`POST`
- 路径：`/admin/settings/email-test`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
  "toEmail": "test@example.com",
  "smtp": {
    "host": "smtp.qq.com",
    "port": 465,
    "user": "noreply@qq.com",
    "pass": "your_password",
    "secure": true
  }
}
```

字段说明：

| 字段名    | 类型   | 必填 | 说明                                 |
| --------- | ------ | ---- | ------------------------------------ |
| `toEmail` | string | 是   | 接收测试邮件的邮箱地址              |
| `smtp`    | object | 是   | SMTP 配置对象（与更新配置接口相同） |

**成功响应**

- 状态码：`200`

```json
{
  "message": "邮件发送成功"
}
```

**错误响应**

- 接收邮箱无效：
  - 状态码：`400`

  ```json
  {
    "message": "请输入有效的接收邮箱"
  }
  ```

- SMTP 配置不完整：
  - 状态码：`400`

  ```json
  {
    "message": "SMTP 配置不完整"
  }
  ```

- 邮件发送失败：
  - 状态码：`500`

  ```json
  {
    "message": "邮件发送失败：具体错误信息"
  }
  ```

## 1.4 获取通知邮箱配置（已废弃）

```
GET /admin/settings/email
```

获取当前通知邮箱配置。

> [!NOTE]
> 此接口已被 `/admin/settings/email-notify` 替代，且管理员通知邮箱已统一由 `/admin/settings/comments` 中的 `adminEmail` 提供，不再推荐使用本接口。

- 方法：`GET`
- 路径：`/admin/settings/email`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
	"email": "admin@example.com"
}
```

**错误响应**

- 状态码：`500`

```json
{
	"message": "错误信息"
}
```

## 1.5 设置通知邮箱（已废弃）

```
PUT /admin/settings/email
```

设置通知邮箱，用于接收新评论提醒。

> [!NOTE]
> 此接口已被 `/admin/settings/email-notify` 替代，且通知收件邮箱已统一使用评论配置中的 `adminEmail`，不再推荐调用本接口。

- 方法：`PUT`
- 路径：`/admin/settings/email`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
	"email": "admin@example.com"
}
```

**成功响应**

- 状态码：`200`

```json
{
	"message": "保存成功"
}
```

**错误响应**

- 邮箱格式不正确：
  - 状态码：`400`

  ```json
  {
  	"message": "邮箱格式不正确"
  }
  ```

- 服务器错误：
  - 状态码：`500`

  ```json
  {
  	"message": "错误信息"
  }
  ```
