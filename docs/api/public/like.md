# 点赞接口

文章和评论点赞相关的公开接口。

## 获取点赞状态

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

## 点赞文章

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
| `ContentC-Type`    | 是   | `application/json`           |                                |
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
