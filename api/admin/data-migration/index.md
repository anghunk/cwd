---
title: "评论数据导入导出"
image: "https://cwd.js.org/icon.png"
---

> Documentation Index
> Fetch the complete documentation index at: https://cwd.js.org/llms.txt
> Use this file to discover all available pages before exploring further.

# 评论数据导入导出

数据导入导出接口用于从其他评论系统迁移数据或备份当前评论数据。

所有接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

## 1.1 导出所有评论数据

```
GET /admin/comments/export
```

导出评论数据，返回格式为 JSON，字段与数据库结构一致。

- 方法：`GET`
- 路径：`/admin/comments/export`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称     | 位置  | 类型   | 必填 | 说明                            |
| -------- | ----- | ------ | ---- | ------------------------------- |
| `siteId` | query | string | 否   | 按站点 ID 筛选导出的评论数据，如 `blog`、`docs` |

说明：

- 当提供 `siteId` 参数且不为 `default` 时，仅导出该站点下的评论数据
- 不提供 `siteId` 参数时，导出所有评论数据

**成功响应**

- 状态码：`200`

```json
[
	{
		"id": 1,
		"pub_date": "2026-01-13 10:00:00",
		"post_slug": "/blog/hello-world",
		"author": "张三",
		"email": "zhangsan@example.com",
		"url": "https://zhangsan.me",
		"ip_address": "127.0.0.1",
		"device": "Desktop",
		"os": "Windows 10",
		"browser": "Chrome 90",
		"user_agent": "Mozilla/5.0 ...",
		"content_text": "很棒的文章！",
		"content_html": "很棒的文章！",
		"parent_id": null,
		"status": "approved",
		"site_id": "blog"
	}
]
```

**错误响应**

- 导出失败：
  - 状态码：`500`

  ```json
  {
  	"message": "导出失败"
  }
  ```

## 1.2 导入评论数据

```
POST /admin/comments/import
```

导入评论数据，支持 JSON 格式，可以是单个对象或数组。

- 方法：`POST`
- 路径：`/admin/comments/import`
- 鉴权：需要（Bearer Token）

**请求体**

```json
[
	{
		"id": 5,
		"pub_date": "2026-01-20T04:36:57.636Z",
		"post_slug": "",
		"author": "1024605422",
		"email": "1024605422@qq.com",
		"url": null,
		"ip_address": "15.235.156.27",
		"device": "Desktop",
		"os": "Windows 10",
		"browser": "Chrome 143.0.0.0",
		"user_agent": "Mozilla/5.0 ...",
		"content_text": "试一下",
		"content_html": "试一下",
		"parent_id": null,
		"status": "approved"
	}
]
```

字段说明：与导出格式一致。如果不提供 `id`，则会自动生成。

说明：

- 若从 CWD 自身导出的评论数据进行恢复，可直接将 `/admin/comments/export` 接口导出的 JSON 原样提交到本接口；
- 若从 Twikoo / Artalk 等其他评论系统迁移数据，可通过管理后台「评论数据导入」功能
- 上传对应的 JSON 文件，前端会自动转换为上述结构后调用本接口。
- 数据导入采用 `INSERT OR REPLACE` 策略，若提供 `id` 字段且存在则会覆盖原有数据

**成功响应**

- 状态码：`200`

```json
{
	"message": "成功导入 1 条评论"
}
```

**错误响应**

- 导入数据为空：
  - 状态码：`400`

  ```json
  {
  	"message": "导入数据为空"
  }
  ```

- 导入失败：
  - 状态码：`500`

  ```json
  {
  	"message": "导入失败"
  }
  ```

## 2. 配置数据导入导出

配置数据对应数据库中的 `Settings` 表，主要用于存储评论配置、邮件配置、功能开关等键值对信息。

### 2.1 导出配置数据

```
GET /admin/export/config
```

- 方法：`GET`
- 路径：`/admin/export/config`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
[
	{
		"key": "comment_admin_email",
		"value": "admin@example.com"
	}
]
```

**错误响应**

- 导出失败：
  - 状态码：`500`

  ```json
  {
  	"message": "导出配置失败"
  }
  ```

### 2.2 导入配置数据

```
POST /admin/import/config
```

导入配置数据，支持单个对象或对象数组。

- 方法：`POST`
- 路径：`/admin/import/config`
- 鉴权：需要（Bearer Token）

**请求体**

```json
[
	{
		"key": "comment_admin_email",
		"value": "admin@example.com"
	}
]
```

字段说明：

- `key`：配置键名，对应 Settings 表中的 `key` 字段；
- `value`：配置值，必须为字符串。

**成功响应**

- 状态码：`200`

```json
{
	"message": "成功导入 1 条配置"
}
```

**错误响应**

- 导入数据为空：
  - 状态码：`400`

  ```json
  {
  	"message": "导入数据为空"
  }
  ```

- 没有有效的配置数据（缺少 key 或 value 非字符串）：
  - 状态码：`400`

  ```json
  {
  	"message": "没有有效的配置数据"
  }
  ```

- 导入失败：
  - 状态码：`500`

  ```json
  {
  	"message": "导入配置失败"
  }
  ```

## 3. 访问 / 点赞统计数据导入导出

统计数据包括页面访问汇总、按日访问明细以及点赞明细。

### 3.1 导出访问 / 点赞统计数据

```
GET /admin/export/stats
```

- 方法：`GET`
- 路径：`/admin/export/stats`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称     | 位置  | 类型   | 必填 | 说明                            |
| -------- | ----- | ------ | ---- | ------------------------------- |
| `siteId` | query | string | 否   | 按站点 ID 筛选导出的统计数据，如 `blog`、`docs` |

说明：

- 当提供 `siteId` 参数且不为 `default` 时，仅导出该站点下的统计数据（包括页面访问汇总、按日访问明细以及点赞明细）
- 不提供 `siteId` 参数时，导出所有站点的统计数据

**成功响应**

- 状态码：`200`

```json
{
	"page_stats": [
		{
			"id": 1,
			"post_slug": "https://example.com/blog/hello-world",
			"post_title": "Hello World",
			"post_url": "https://example.com/blog/hello-world",
			"pv": 100,
			"last_visit_at": 1738060800000,
			"created_at": 1738060800000,
			"updated_at": 1738147200000
		}
	],
	"page_visit_daily": [
		{
			"id": 1,
			"date": "2026-01-28",
			"domain": "example.com",
			"count": 50,
			"created_at": 1738060800000,
			"updated_at": 1738147200000,
			"site_id": "blog"
		}
	],
	"likes": [
		{
			"id": 1,
			"page_slug": "https://example.com/blog/hello-world",
			"user_id": "some-user-id",
			"created_at": 1738060800000,
			"site_id": "blog"
		}
	]
}
```

**错误响应**

- 导出失败：
  - 状态码：`500`

  ```json
  {
  	"message": "导出统计数据失败"
  }
  ```

### 3.2 导入访问 / 点赞统计数据

```
POST /admin/import/stats
```

导入访问 / 点赞统计数据，请求体结构需与导出格式一致。

- 方法：`POST`
- 路径：`/admin/import/stats`
- 鉴权：需要（Bearer Token）

**请求体**

```json
{
	"page_stats": [],
	"page_visit_daily": [],
	"likes": []
}
```

说明：

- 三个字段均为可选数组，不提供则视为不导入该类数据；
- 若包含 `id` 字段，将执行插入或替换操作。

**成功响应**

- 状态码：`200`

```json
{
	"message": "成功导入 0 条统计数据"
}
```

**错误响应**

- 数据格式错误（请求体不是对象）：
  - 状态码：`400`

  ```json
  {
  	"message": "数据格式错误"
  }
  ```

- 导入失败：
  - 状态码：`500`

  ```json
  {
  	"message": "导入统计数据失败"
  }
  ```

## 4. 全量备份与恢复

通过全量导出 / 导入，可以一次性备份或恢复评论、配置和统计数据。

### 4.1 全量导出（备份）

```
GET /admin/export/backup
```

- 方法：`GET`
- 路径：`/admin/export/backup`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
	"version": "1.0",
	"timestamp": 1738147200000,
	"comments": [],
	"settings": [],
	"page_stats": [],
	"page_visit_daily": [],
	"likes": []
}
```

说明：

- `comments` 字段等同于 `/admin/comments/export` 导出的结果；
- `settings` 字段等同于 `/admin/export/config` 导出的结果；
- `page_stats` / `page_visit_daily` / `likes` 字段等同于 `/admin/export/stats` 导出的结果。

**错误响应**

- 导出失败：
  - 状态码：`500`

  ```json
  {
  	"message": "全量导出失败"
  }
  ```

### 4.2 全量导入（恢复）

```
POST /admin/import/backup
```

使用 `/admin/export/backup` 导出的 JSON 文件进行一键恢复。

- 方法：`POST`
- 路径：`/admin/import/backup`
- 鉴权：需要（Bearer Token）

**请求体**

```json
{
	"version": "1.0",
	"timestamp": 1738147200000,
	"comments": [],
	"settings": [],
	"page_stats": [],
	"page_visit_daily": [],
	"likes": []
}
```

说明：

- 若某个字段为空数组或未提供，则不会对对应数据进行导入；
- 评论导入时支持带 `id` 字段的覆盖写入。

**成功响应**

- 状态码：`200`

```json
{
	"message": "导入结果： 评论 0 条; 配置 0 条; 统计数据 0 条;"
}
```

**错误响应**

- 数据格式错误（请求体不是对象）：
  - 状态码：`400`

  ```json
  {
  	"message": "数据格式错误"
  }
  ```

- 导入失败：
  - 状态码：`500`

  ```json
  {
  	"message": "全量导入失败"
  }
  ```

Source: https://cwd.js.org/api/admin/data-migration/index.mdx
