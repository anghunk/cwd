# 访问统计

页面访问统计接口，用于记录和分析页面访问数据。

## 记录页面访问

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
!  }
  ```
