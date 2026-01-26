# 公开 API 相关

无需认证即可访问的公开接口，包括评论获取、评论提交、配置获取和身份验证。

包含路径、方法、参数、请求体和响应示例。

## 1. 评论相关

### 1.1 获取指定文章的评论列表

```
GET /api/comments
```

获取指定文章的评论列表，支持分页和嵌套结构。

- 方法：`GET`
- 路径：`/api/comments`
- 鉴权：不需要

**查询参数**

| 名称        | 位置  | 类型    | 必填 | 说明                                                                                         |
| ----------- | ----- | ------- | ---- | -------------------------------------------------------------------------------------------- |
| `post_slug` | query | string  | 是   | 使用 `window.location.origin + window.location.pathname`，获取带域名的链接，否则后台无法识别 |
| `page`      | query | integer | 否   | 页码，默认 `1`                                                                               |
| `limit`     | query | integer | 否   | 每页数量，默认 `20`，最大 `50`                                                               |
| `nested`    | query | string  | 否   | 是否返回嵌套结构，默认 `'true'`                                                              |

**成功响应**

- 状态码：`200`

```json
{
  "data": [
    {
      "id": 1,
      "author": "张三",
      "email": "zhangsan@example.com",
      "url": "https://example.com",
      "contentText": "很棒的文章！",
      "contentHtml": "很棒的文章！",
      "pubDate": "2026-01-13T10:00:00Z",
      "postSlug": "/blog/hello-world",
      "avatar": "https://gravatar.com/avatar/...",
      "priority": 2,
      "likes": 5,
      "replies": [
        {
          "id": 2,
          "author": "李四",
          "email": "lisi@example.com",
          "url": null,
          "contentText": "同感！",
          "contentHtml": "同感！",
          "pubDate": "2026-01-13T11:00:00Z",
          "postSlug": "/blog/hello-world",
          "avatar": "https://gravatar.com/avatar/...",
          "parentId": 1,
          "replyToAuthor": "张三",
          "priority": 1,
          "likes": 2
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalCount": 2
  }
}
```

说明：

- 当 `nested=true`（默认）时，接口返回的是"根评论列表"，每条根评论包含其 `replies`。
- 当 `nested=false` 时，接口返回扁平列表，所有评论都在 `data` 中，`replies` 为空。
- `priority` 字段：评论的置顶权重，数值越大排序越靠前。
- `likes` 字段：评论的点赞数，默认为 0。

**错误响应**

- 缺少 `post_slug`：

  - 状态码：`400`

  ```json
  {
    "message": "post_slug is required"
  }
  ```

- 服务器内部错误：

  - 状态码：`500`

  ```json
  {
    "message": "错误信息"
  }
  ```

### 1.2 提交新评论或回复

```
POST /api/comments
```

提交新评论或回复。

- 方法：`POST`
- 路径：`/api/comments`
- 鉴权：不需要

**请求头**

| 名称           | 必填 | 示例                         |
| -------------- | ---- | ---------------------------- |
| `Content-Type` | 是   | `application/json`          |

**请求体（Request Body）**

```json
{
  "post_slug": "https://example.com/blog/hello-world",
  "post_title": "博客标题，可选",
  "post_url": "https://example.com/blog/hello-world",
  "name": "张三",
  "email": "zhangsan@example.com",
  "url": "https://zhangsan.me",
  "content": "很棒的文章！",
  "parent_id": 1,
  "adminToken": "your-admin-key"
}
```

字段说明：

| 字段名       | 类型   | 必填 | 说明                                                                                                          |
| ------------ | ------ | ---- | ------------------------------------------------------------------------------------------------------------- |
| `post_slug`  | string | 是   | 文章唯一标识符，应与前端组件初始化时的 `postSlug` 值一致，`window.location.origin + window.location.pathname` |
| `post_title` | string | 否   | 文章标题，用于邮件通知内容                                                                                    |
| `post_url`   | string | 否   | 文章 URL，用于邮件通知中的跳转链接                                                                            |
| `name`       | string | 是   | 评论者昵称                                                                                                    |
| `email`      | string | 是   | 评论者邮箱，需为合法邮箱格式                                                                                  |
| `url`        | string | 否   | 评论者个人主页或站点地址                                                                                      |
| `content`    | string | 是   | 评论内容，内部会过滤 `<script>...</script>` 片段                                                              |
| `parent_id`  | number | 否   | 父评论 ID，用于回复功能；缺省或 `null` 表示根评论                                                             |
| `adminToken` | string | 否   | 管理员评论密钥，博主发布评论时需要先通过 `/api/verify-admin` 验证密钥后将密钥传入此字段，评论将直接通过且不受审核设置影响 |

**成功响应**

- 状态码：`200`

评论直接通过时：

```json
{
  "message": "评论已提交",
  "status": "approved"
}
```

评论进入待审核状态时（开启"先审核再显示"且非管理员评论）：

```json
{
  "message": "已提交评论，待管理员审核后显示",
  "status": "pending"
}
```

**错误响应**

- 请求体缺失或字段类型错误：

  - 状态码：`400`

  ```json
  {
    "message": "无效的请求体"
  }
  ```

- 缺少必填字段：

  - `post_slug` 为空：

    ```json
    {
      "message": "post_slug 必填"
    }
    ```

  - `content` 为空：

    ```json
    {
      "message": "评论内容不能为空"
    }
    ```

  - `author` 为空：

    ```json
    {
      "message": "昵称不能为空"
    }
    ```

  - `email` 为空或格式不正确：

    ```json
    {
      "message": "邮箱不能为空"
    }
    ```

    或

    ```json
    {
      "message": "邮箱格式不正确"
    }
    ```

- IP 或邮箱被限制：

  - IP 被限制：
    - 状态码：`403`

    ```json
    {
      "message": "当前 IP 已被限制评论，请联系站长进行处理"
    }
    ```

  - 邮箱被限制：
    - 状态码：`403`

    ```json
    {
      "message": "当前邮箱已被限制评论，请联系站长进行处理"
    }
    ```

- 管理员评论验证失败：

  - 未输入密钥：
    - 状态码：`401`

    ```json
    {
      "message": "请输入管理员密钥",
      "requireAuth": true
    }
    ```

  - 密钥错误：
    - 状态码：`401`

    ```json
    {
      "message": "密钥错误"
    }
    ```

  - 验证失败次数过多：
    - 状态码：`403`

    ```json
    {
      "message": "验证失败次数过多，请 30 分钟后再试"
    }
    ```

- 评论频率限制：

  - 状态码：`429`
  - 逻辑：同一 IP 最近一条评论时间在 10 秒内，则拒绝此次请求。

  ```json
  {
    "message": "评论频繁，等 10s 后再试"
  }
  ```

- 服务器内部错误：

  - 状态码：`500`

  ```json
  {
    "message": "Internal Server Error"
  }
  ```

### 1.3 获取点赞状态

```
GET /api/like
```

获取当前页面的点赞状态和总点赞数，一般由前端组件在页面加载时自动调用。

- 方法：`GET`
- 路径：`/api/like`
- 鉴权：不需要

**查询参数**

| 名称        | 位置  | 类型   | 必填 | 说明                                                |
| ----------- | ----- | ------ | ---- | --------------------------------------------------- |
| `post_slug` | query | string | 是   | 页面唯一标识符，`window.location.origin + window.location.pathname` |

**请求头（可选）**

| 名称              | 必填 | 示例                          | 说明                           |
| ----------------- | ---- | ----------------------------- | ------------------------------ |
| `X-CWD-Like-User` | 否   | `550e8400-e29b-41d4-a716...` | 前端生成的匿名用户标识，用于区分不同用户 |

未显式传入 `X-CWD-Like-User` 时，服务端会尝试使用 `cf-connecting-ip` 作为用户标识，找不到时退回到 `anonymous`。

**成功响应**

- 状态码：`200`

```json
{
  "liked": false,
  "alreadyLiked": false,
  "totalLikes": 12
}
```

字段说明：

| 字段名        | 类型    | 说明                                     |
| ------------- | ------- | ---------------------------------------- |
| `liked`       | boolean | 当前用户是否已点赞                       |
| `alreadyLiked` | boolean | 预留字段，当前实现始终为 `false`        |
| `totalLikes`  | number  | 当前页面的总点赞数                       |

**错误响应**

- 缺少 `post_slug`：

  - 状态码：`400`

  ```json
  {
    "message": "post_slug is required"
  }
  ```

- 服务器内部错误：

  - 状态码：`500`

  ```json
  {
    "message": "获取点赞状态失败"
  }
  ```

### 1.4 点赞当前页面

```
POST /api/like
```

对当前页面执行点赞操作，同一用户对同一页面只会计入一次点赞。

- 方法：`POST`
- 路径：`/api/like`
- 鉴权：不需要

**请求头**

| 名称              | 必填 | 示例                          | 说明                           |
| ----------------- | ---- | ----------------------------- | ------------------------------ |
| `Content-Type`    | 是   | `application/json`           |                                |
| `X-CWD-Like-User` | 否   | `550e8400-e29b-41d4-a716...` | 前端生成的匿名用户标识，用于区分不同用户 |

**请求体**

```json
{
  "postSlug": "https://example.com/blog/hello-world",
  "postTitle": "博客标题，可选",
  "postUrl": "https://example.com/blog/hello-world"
}
```

字段说明：

| 字段名      | 类型   | 必填 | 说明                                                                 |
| ----------- | ------ | ---- | -------------------------------------------------------------------- |
| `postSlug`  | string | 是   | 页面唯一标识符，应与评论接口中的 `post_slug` 一致                   |
| `postTitle` | string | 否   | 页面标题，用于点赞统计中显示                                       |
| `postUrl`   | string | 否   | 页面 URL，用于点赞统计中跳转                                       |

**成功响应**

- 状态码：`200`

```json
{
  "liked": true,
  "alreadyLiked": false,
  "totalLikes": 13
}
```

说明：

- 第一次点赞：`liked=true`，`alreadyLiked=false`，`totalLikes` 增加 1；
- 重复点赞：服务器不会重复插入记录，`alreadyLiked=true`，`totalLikes` 不会继续增加。

**错误响应**

- 缺少 `postSlug`：

  - 状态码：`400`

  ```json
  {
    "message": "postSlug is required"
  }
  ```

- 服务器内部错误：

  - 状态码：`500`

  ```json
  {
    "message": "点赞失败"
  }
  ```

### 1.5 评论点赞

```
POST /api/comments/like
```

对指定评论进行点赞操作。

- 方法：`POST`
- 路径：`/api/comments/like`
- 鉴权：不需要

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
  "id": 123
}
```

字段说明：

| 字段名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| `id`   | number | 是   | 评论 ID |

**成功响应**

- 状态码：`200`

```json
{
  "message": "点赞成功",
  "likes": 5
}
```

字段说明：

| 字段名  | 类型   | 说明           |
| ------- | ------ | -------------- |
| `likes` | number | 更新后的点赞数 |

**错误响应**

- 状态码：`400`

```json
{
  "message": "评论不存在"
}
```

### 1.6 取消评论点赞

```
DELETE /api/comments/like
```

取消对指定评论的点赞。

- 方法：`DELETE`
- 路径：`/api/comments/like`
- 鉴权：不需要

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
  "id": 123
}
```

字段说明：

| 字段名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| `id`   | number | 是   | 评论 ID |

**成功响应**

- 状态码：`200`

```json
{
  "message": "取消点赞成功",
  "likes": 4
}
```

字段说明：

| 字段名  | 类型   | 说明           |
| ------- | ------ | -------------- |
| `likes` | number | 更新后的点赞数 |

**错误响应**

- 状态码：`400`

```json
{
  "message": "评论不存在"
}
```

## 2. 配置相关

### 2.1 获取评论相关的公开配置

```
GET /api/config/comments
```

获取评论相关的公开配置，用于前端组件读取博主邮箱、徽标等信息。

- 方法：`GET`
- 路径：`/api/config/comments`
- 鉴权：不需要

**成功响应**

- 状态码：`200`

```json
{
  "adminEmail": "admin@example.com",
  "adminBadge": "博主",
  "avatar": "https://gravatar.com/avatar",
  "adminEnabled": true,
  "allowedDomains": [],
  "requireReview": false
}
```

字段说明：

| 字段名             | 类型    | 说明                                                                 |
| ------------------ | ------- | -------------------------------------------------------------------- |
| `adminEmail`       | string  | 博主邮箱地址，用于在前端展示"博主"标识，并触发管理员身份验证流程   |
| `adminBadge`       | string  | 博主标识文字，例如 `"博主"`                                          |
| `avatarPrefix`     | string  | 头像地址前缀，如 Gravatar 或 Cravatar 镜像地址                      |
| `adminEnabled`     | boolean | 是否启用博主标识相关展示（关闭时不显示徽标，但仍可作为管理员邮箱） |
| `allowedDomains`   | Array\<string\> | 允许调用组件的域名列表，留空则不限制                         |
| `requireReview`     | boolean | 是否开启新评论先审核再显示（true 表示新评论默认为待审核）          |
| `enableCommentLike` | boolean | 是否启用评论点赞功能（默认 true）                                   |
| `enableArticleLike` | boolean | 是否启用文章点赞功能（默认 true）                                   |

**错误响应**

- 状态码：`500`

```json
{
  "message": "加载评论配置失败"
}
```

## 3. 身份验证相关

### 3.1 验证管理员密钥

```
POST /api/verify-admin
```

验证前台管理员评论所需的密钥，用于博主发布评论时的身份验证。

- 方法：`POST`
- 路径：`/api/verify-admin`
- 鉴权：不需要

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
  "adminToken": "your-admin-key"
}
```

字段说明：

| 字段名      | 类型   | 必填 | 说明           |
| ----------- | ------ | ---- | -------------- |
| `adminToken` | string | 是   | 管理员评论密钥 |

**风控说明**

- 本地密钥存活时间 72 小时
- 同一 IP 连续验证失败 3 次后，该 IP 将被锁定 30 分钟
- 失败次数记录有效期为 1 小时

**成功响应**

- 状态码：`200`

```json
{
  "message": "验证通过"
}
```

或未设置密钥时：

```json
{
  "message": "未设置管理员密钥"
}
```

**错误响应**

- 寽钥错误：
  - 状态码：`401`

  ```json
  {
    "message": "密钥错误"
  }
  ```

- 验证失败次数过多：
  - 状态码：`403`

  ```json
  {
    "message": "验证失败次数过多，请 30 分钟后再试"
  }
  ```

## 4. 访问统计相关

### 4.1 记录页面访问

```
POST /api/analytics/visit
```

前端组件在加载时调用此接口，记录页面访问数据，用于后台访问统计分析。

- 方法：`POST`
- 路径：`/api/analytics/visit`
- 鉴权：不需要

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
  "postSlug": "https://example.com/blog/hello-world",
  "postTitle": "博客标题",
  "postUrl": "https://example.com/blog/hello-world"
}
```

字段说明：

| 字段名      | 类型   | 必填 | 说明                                                                 |
| ----------- | ------ | ---- | -------------------------------------------------------------------- |
| `postSlug`  | string | 是   | 文章唯一标识符，`window.location.origin + window.location.pathname`     |
| `postTitle` | string | 否   | 文章标题，用于后台展示页面名称                                        |
| `postUrl`   | string | 否   | 文章 URL，用于后台展示页面链接和域名统计                              |

**成功响应**

- 状态码：`200`

```json
{
  "success": true
}
```

**错误响应**

- 缺少 `postSlug`：

  - 状态码：`400`

  ```json
  {
    "message": "postSlug is required"
  }
  ```

- 服务器内部错误：

  - 状态码：`500`

  ```json
  {
    "message": "记录访问数据失败"
  }
  ```
