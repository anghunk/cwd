# 评论设置

评论设置接口用于获取和更新评论相关的配置，包括博主邮箱、徽标、头像前缀、管理员密钥、域名白名单、审核设置以及 IP/邮箱黑名单。

所有接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

## 1.1 获取评论配置

```
GET /admin/settings/comments
```

获取评论配置，例如博主邮箱、徽标、头像前缀、管理员密钥等。

- 方法：`GET`
- 路径：`/admin/settings/comments`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
	"adminEmail": "admin@example.com",
	"adminBadge": "博主",
	"avatarPrefix": "https://gravatar.com/avatar",
	"adminEnabled": true,
	"allowedDomains": [],
	"adminKey": "your-admin-key",
	"adminKeySet": true,
	"requireReview": false,
	"blockedIps": ["1.1.1.1", "2.2.2.2"],
	"blockedEmails": ["spam@example.com", "bot@test.com"]
}
```

字段说明（相比公开接口 `/api/config/comments` 增加了管理员密钥相关字段）：

| 字段名           | 类型            | 说明                                                      |
| ---------------- | --------------- | --------------------------------------------------------- |
| `adminEmail`     | string          | 博主邮箱地址，用于显示"博主"标识、管理员身份验证以及接收新评论邮件通知 |
| `adminBadge`     | string          | 博主标识文字，例如 `"博主"`                               |
| `avatarPrefix`   | string          | 头像地址前缀，如 Gravatar 或 Cravatar 镜像地址            |
| `adminEnabled`   | boolean         | 是否启用博主标识相关展示                                  |
| `allowedDomains` | Array\<string\> | 允许调用组件的域名列表，留空则不限制                      |
| `adminKey`       | string\|null    | 管理员评论密钥（明文），仅通过管理后台接口返回            |
| `adminKeySet`    | boolean         | 是否已经设置过管理员管理员评论密钥                              |
| `requireReview`  | boolean         | 是否开启新评论先审核再显示（true 表示新评论默认为待审核） |
| `blockedIps`     | Array\<string\> | IP 黑名单列表，匹配到的 IP 提交评论将被拒绝               |
| `blockedEmails`  | Array\<string\> | 邮箱黑名单列表，匹配到的邮箱提交评论将被拒绝              |

**错误响应**

- 状态码：`500`

```json
{
	"message": "加载评论配置失败"
}
```

## 1.2 更新评论配置

```
PUT /admin/settings/comments
```

更新评论配置。

- 方法：`PUT`
- 路径：`/admin/settings/comments`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
	"adminEmail": "admin@example.com",
	"adminBadge": "站长",
	"avatarPrefix": "https://cravatar.cn/avatar",
	"adminEnabled": true,
	"allowedDomains": [],
	"adminKey": "your-admin-key",
	"requireReview": false,
	"blockedIps": ["1.1.1.1", "2.2.2.2"],
	"blockedEmails": ["spam@example.com", "bot@test.com"]
}
```

字段说明：

| 字段名           | 类型    | 必填 | 说明                                                               |
| ---------------- | ------- | ---- | ------------------------------------------------------------------ |
| `adminEmail`     | string  | 否   | 博主邮箱地址，需为合法邮箱                                         |
| `adminBadge`     | string  | 否   | 博主标识文字，例如 `"博主"`                                        |
| `avatarPrefix`   | string  | 否   | 头像地址前缀，如 Gravatar 或 Cravatar 镜像地址                     |
| `adminEnabled`   | boolean | 否   | 是否启用博主标识相关展示                                           |
| `allowedDomains` | Array   | 否   | 允许前端调用组件的域名列表                                         |
| `adminKey`       | string  | 否   | 管理员评论密钥，留空则表示清除密钥；设置后前台管理员评论需输入密钥 |
| `requireReview`  | boolean | 否   | 是否开启新评论先审核再显示（不传则保持不变）                       |
| `blockedIps`     | Array   | 否   | IP 黑名单列表，多个 IP 用逗号或换行分隔                            |
| `blockedEmails`  | Array   | 否   | 邮箱黑名单列表，多个邮箱用逗号或换行分隔                           |

**成功响应**

- 状态码：`200`

```json
{
	"message": "保存成功"
}
```

**错误响应**

- 邮箱格式错误：
  - 状态码：`400`

  ```json
  {
  	"message": "邮箱格式不正确"
  }
  ```

- 内部错误：
  - 状态码：`500`

  ```json
  {
  	"message": "保存失败"
  }
  ```
