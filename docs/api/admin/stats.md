# 统计数据

统计数据接口用于获取评论统计、域名列表等数据看板相关信息。

所有接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

## 1.1 获取评论统计数据（数据看板）

```
GET /admin/stats/comments
```

用于管理后台「数据看板」展示评论整体统计、按站点统计以及最近 30 天评论趋势。

- 方法：`GET`
- 路径：`/admin/stats/comments`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
	"summary": {
		"total": 123,
		"approved": 100,
		"pending": 20,
		"rejected": 3
	},
	"domains": [
		{
			"domain": "example.com",
			"total": 80,
			"approved": 70,
			"pending": 8,
			"rejected": 2
		},
		{
			"domain": "blog.example.com",
			"total": 30,
			"approved": 20,
			"pending": 9,
			"rejected": 1
		}
	],
	"last7Days": [
		{
			"date": "2026-01-15",
			"total": 10
		},
		{
			"date": "2026-01-16",
			"total": 12
		}
	]
}
```

字段说明：

| 字段名               | 类型                | 说明                                  |
| -------------------- | ------------------- | ------------------------------------- |
| `summary`            | object              | 评论整体汇总统计                      |
| `summary.total`      | number              | 评论总数                              |
| `summary.approved`   | number              | 已通过评论数                          |
| `summary.pending`    | number              | 待审核评论数                          |
| `summary.rejected`   | number              | 已拒绝评论数                          |
| `domains`            | Array\<DomainStat\> | 按域名聚合的评论统计列表              |
| `domains[].domain`   | string              | 解析后的域名（如 `example.com`）      |
| `domains[].total`    | number              | 该域名下评论总数                      |
| `domains[].approved` | number              | 该域名下已通过评论数                  |
| `domains[].pending`  | number              | 该域名下待审核评论数                  |
| `domains[].rejected` | number              | 该域名下已拒绝评论数                  |
| `last7Days`          | Array\<DailyStat\>  | 最近 30 天的每日评论数（按自然日聚合） |
| `last7Days[].date`   | string (YYYY-MM-DD) | 日期，UTC 时间格式化后的自然日        |
| `last7Days[].total`  | number              | 当日评论总数                          |

**错误响应**

- 状态码：`500`

```json
{
	"message": "获取统计数据失败"
}
```

## 1.2 获取点赞统计数据（点赞排行榜）

```
GET /admin/likes/stats
```

用于管理后台展示按点赞数排序的页面列表，例如「点赞排行榜」。

- 方法：`GET`
- 路径：`/admin/likes/stats`
- 鉴权：需要（Bearer Token）

当前实现不接收查询参数，默认返回点赞数最多的前 50 条记录。

**成功响应**

- 状态码：`200`

```json
{
  "items": [
    {
      "pageSlug": "https://example.com/blog/hello-world",
      "pageTitle": "Hello World",
      "pageUrl": "https://example.com/blog/hello-world",
      "likes": 12
    }
  ]
}
```

字段说明：

| 字段名       | 类型   | 说明                         |
| ------------ | ------ | ---------------------------- |
| `pageSlug`   | string | 页面唯一标识符               |
| `pageTitle`  | string \| null | 页面标题            |
| `pageUrl`    | string \| null | 页面 URL           |
| `likes`      | number | 当前页面累计点赞数           |

**错误响应**

- 状态码：`500`

```json
{
  "message": "获取点赞统计失败"
}
```

## 1.4 获取点赞记录列表

```
GET /admin/likes/list
```

用于管理后台查看单条点赞记录列表，支持按页面、用户以及时间范围筛选。

- 方法：`GET`
- 路径：`/admin/likes/list`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称        | 位置  | 类型    | 必填 | 说明                                                |
| ----------- | ----- | ------- | ---- | --------------------------------------------------- |
| `page`      | query | integer | 否   | 页码，默认 `1`                                     |
| `page_slug` | query | string  | 否   | 按页面标识筛选点赞记录                             |
| `user_id`   | query | string  | 否   | 按用户标识筛选点赞记录，对应前端的 `X-CWD-Like-User` |
| `start`     | query | number  | 否   | 起始时间（毫秒时间戳），大于等于该时间的记录       |
| `end`       | query | number  | 否   | 结束时间（毫秒时间戳），小于等于该时间的记录       |

说明：

- 当前实现中每页固定大小为 `20`；
- 既可以使用 `page_slug` / `user_id`，也可以同时使用两者进行组合筛选。

**成功响应**

- 状态码：`200`

```json
{
  "data": [
    {
      "id": 1,
      "pageSlug": "https://example.com/blog/hello-world",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": 1737593600000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

字段说明：

| 字段名               | 类型   | 说明                         |
| -------------------- | ------ | ---------------------------- |
| `data[].id`          | number | 点赞记录 ID                  |
| `data[].pageSlug`    | string | 页面唯一标识符               |
| `data[].userId`      | string | 用户标识（来自 `X-CWD-Like-User` 或 IP） |
| `data[].createdAt`   | number | 点赞时间戳（毫秒）           |
| `pagination.page`    | number | 当前页码                     |
| `pagination.limit`   | number | 每页数量（固定为 20）        |
| `pagination.total`   | number | 总页数                       |

**错误响应**

- 状态码：`500`

```json
{
  "message": "获取点赞记录失败"
}
```
