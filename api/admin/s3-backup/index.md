---
title: "S3 备份"
image: "https://cwd.js.org/icon.png"
---

> Documentation Index
> Fetch the complete documentation index at: https://cwd.js.org/llms.txt
> Use this file to discover all available pages before exploring further.

# S3 备份

S3 备份接口用于配置 S3 兼容存储服务，并实现数据的自动备份和恢复。

所有接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

## 1. S3 配置管理

### 1.1 获取 S3 配置

```
GET /admin/settings/s3
```

获取当前 S3 存储配置信息。

- 方法：`GET`
- 路径：`/admin/settings/s3`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
  "endpoint": "https://s3.example.com",
  "accessKeyId": "your-access-key-id",
  "secretAccessKey": "your-secret-access-key",
  "bucket": "your-bucket-name",
  "region": "auto"
}
```

字段说明：

| 字段名            | 类型   | 说明                                |
| ----------------- | ------ | ----------------------------------- |
| `endpoint`        | string | S3 服务端点地址                     |
| `accessKeyId`     | string | 访问密钥 ID                         |
| `secretAccessKey` | string | 访问密钥                            |
| `bucket`          | string | 存储桶名称                          |
| `region`          | string | 区域，默认为 `auto`                 |

**错误响应**

- 状态码：`500`

```json
{
  "message": "加载 S3 配置失败"
}
```

### 1.2 更新 S3 配置

```
PUT /admin/settings/s3
```

更新 S3 存储配置信息。

- 方法：`PUT`
- 路径：`/admin/settings/s3`
- 鉴权：需要（Bearer Token）

**请求体**

```json
{
  "endpoint": "https://s3.example.com",
  "accessKeyId": "your-access-key-id",
  "secretAccessKey": "your-secret-access-key",
  "bucket": "your-bucket-name",
  "region": "auto"
}
```

字段说明：

| 字段名            | 类型   | 必填 | 说明                                |
| ----------------- | ------ | ---- | ----------------------------------- |
| `endpoint`        | string | 否   | S3 服务端点地址                     |
| `accessKeyId`     | string | 否   | 访问密钥 ID                         |
| `secretAccessKey` | string | 否   | 访问密钥                            |
| `bucket`          | string | 否   | 存储桶名称                          |
| `region`          | string | 否   | 区域，默认为 `auto`                 |

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

## 2. 备份操作

### 2.1 触发备份

```
POST /admin/backup/s3
```

手动触发一次数据备份，将评论、配置和统计数据上传到 S3 存储。

- 方法：`POST`
- 路径：`/admin/backup/s3`
- 鉴权：需要（Bearer Token）

**前置条件**

需要先完成 S3 配置，否则将返回错误。

**成功响应**

- 状态码：`200`

```json
{
  "message": "备份成功",
  "file": "cwd-backup-2026-01-15-1737593600000.json"
}
```

字段说明：

| 字段名    | 类型   | 说明                         |
| --------- | ------ | ---------------------------- |
| `message` | string | 操作结果信息                 |
| `file`    | string | 备份文件名称                 |

**错误响应**

- S3 配置不完整：

  - 状态码：`400`

  ```json
  {
    "message": "S3 配置不完整，请先配置 S3 信息"
  }
  ```

- 备份失败：

  - 状态码：`500`

  ```json
  {
    "message": "S3 备份失败"
  }
  ```

### 2.2 获取备份列表

```
GET /admin/backup/s3/list
```

获取 S3 存储中的备份文件列表。

- 方法：`GET`
- 路径：`/admin/backup/s3/list`
- 鉴权：需要（Bearer Token）

**前置条件**

需要先完成 S3 配置，否则将返回错误。

**成功响应**

- 状态码：`200`

```json
{
  "files": [
    {
      "key": "cwd-backup-2026-01-15-1737593600000.json",
      "lastModified": "2026-01-15T10:00:00.000Z",
      "size": 102400
    }
  ]
}
```

字段说明：

| 字段名         | 类型   | 说明               |
| -------------- | ------ | ------------------ |
| `files`        | Array  | 备份文件列表       |
| `files[].key`  | string | 文件名（唯一标识） |
| `files[].lastModified` | string | 最后修改时间（ISO 8601 格式） |
| `files[].size` | number | 文件大小（字节）   |

**错误响应**

- 状态码：`500`

```json
{
  "message": "获取备份列表失败"
}
```

### 2.3 下载备份

```
GET /admin/backup/s3/download
```

从 S3 存储下载指定的备份文件。

- 方法：`GET`
- 路径：`/admin/backup/s3/download`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称  | 位置  | 类型   | 必填 | 说明               |
| ----- | ----- | ------ | ---- | ------------------ |
| `key` | query | string | 是   | 备份文件名（Key）  |

**前置条件**

需要先完成 S3 配置，否则将返回错误。

**成功响应**

- 状态码：`200`
- Content-Type：`application/json`
- Content-Disposition：`attachment; filename="<key>"`

返回备份文件的 JSON 内容，格式与全量备份一致：

```json
{
  "version": "1.0",
  "timestamp": 1737593600000,
  "comments": [],
  "settings": [],
  "page_stats": [],
  "page_visit_daily": [],
  "likes": []
}
```

**错误响应**

- 缺少 `key` 参数：

  - 状态码：`400`

  ```json
  {
    "message": "缺少 key 参数"
  }
  ```

- 下载失败：

  - 状态码：`500`

  ```json
  {
    "message": "下载备份失败"
  }
  ```

### 2.4 删除备份

```
DELETE /admin/backup/s3
```

删除 S3 存储中指定的备份文件。

- 方法：`DELETE`
- 路径：`/admin/backup/s3`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称  | 位置  | 类型   | 必填 | 说明               |
| ----- | ----- | ------ | ---- | ------------------ |
| `key` | query | string | 是   | 备份文件名（Key）  |

**前置条件**

需要先完成 S3 配置，否则将返回错误。

**成功响应**

- 状态码：`200`

```json
{
  "message": "删除成功"
}
```

**错误响应**

- 缺少 `key` 参数：

  - 状态码：`400`

  ```json
  {
    "message": "缺少 key 参数"
  }
  ```

- 删除失败：

  - 状态码：`500`

  ```json
  {
    "message": "删除备份失败"
  }
  ```

## 3. 支持的 S3 兼容存储

本系统支持所有 S3 兼容的存储服务，包括但不限于：

| 服务商             | 端点示例                              |
| ------------------ | ------------------------------------- |
| AWS S3             | `https://s3.<region>.amazonaws.com`   |
| Cloudflare R2      | `https://<account-id>.r2.cloudflarestorage.com` |
| Backblaze B2       | `https://s3.<region>.backblazeb2.com` |
| MinIO              | `https://your-minio-server.com`       |
| 阿里云 OSS         | `https://oss-<region>.aliyuncs.com`   |
| 腾讯云 COS         | `https://cos.<region>.myqcloud.com`   |

## 4. 备份数据格式

S3 备份生成的 JSON 文件格式与全量备份一致，包含以下内容：

| 字段名             | 类型   | 说明                     |
| ------------------ | ------ | ------------------------ |
| `version`          | string | 备份格式版本，当前为 `1.0` |
| `timestamp`        | number | 备份时间戳（毫秒）       |
| `comments`         | Array  | 评论数据                 |
| `settings`         | Array  | 系统配置数据             |
| `page_stats`       | Array  | 页面访问统计             |
| `page_visit_daily` | Array  | 按日访问明细             |
| `likes`            | Array  | 点赞记录                 |

Source: https://cwd.js.org/api/admin/s3-backup/index.mdx
