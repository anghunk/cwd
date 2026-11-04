---
title: "管理员 API"
image: "https://cwd.js.org/icon.png"
---

> Documentation Index
> Fetch the complete documentation index at: https://cwd.js.org/llms.txt
> Use this file to discover all available pages before exploring further.

# 管理员 API

管理员接口用于登录后台、查看和管理评论、配置邮件通知和评论显示设置。

除登录接口外，所有管理员接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

Token 通过登录接口获取，有效期为 48 小时。

## 接口分类

### [身份认证相关](/api/admin/auth)

- **管理员登录** `POST /admin/login` - 获取后续调用其他管理员接口所需的临时 Token

### [评论管理相关](/api/admin/comments)

- **获取评论列表** `GET /admin/comments/list` - 获取评论列表，用于后台管理页面展示
- **更新评论状态** `PUT /admin/comments/status` - 更新评论状态（例如通过 / 拒绝）
- **更新评论内容** `PUT /admin/comments/update` - 更新评论的详细信息
- **删除指定评论** `DELETE /admin/comments/delete` - 删除指定评论
- **加入 IP 黑名单** `POST /admin/comments/block-ip` - 将指定 IP 加入评论黑名单
- **加入邮箱黑名单** `POST /admin/comments/block-email` - 将指定邮箱加入评论黑名单

### [数据管理相关](/api/admin/data-migration)

- **导出所有评论数据** `GET /admin/comments/export` - 导出所有评论数据（仅评论）
- **导入评论数据** `POST /admin/comments/import` - 导入评论数据，支持 Twikoo / Artalk / CWD JSON
- **导出配置数据** `GET /admin/export/config` - 导出系统配置（Settings 表）
- **导入配置数据** `POST /admin/import/config` - 导入系统配置
- **导出访问 / 点赞统计数据** `GET /admin/export/stats` - 导出访问量、按日统计和点赞明细
- **导入访问 / 点赞统计数据** `POST /admin/import/stats` - 导入访问和点赞统计
- **全量导出（备份）** `GET /admin/export/backup` - 一次性导出评论 + 配置 + 统计数据
- **全量导入（恢复）** `POST /admin/import/backup` - 从备份文件恢复全部数据

### [评论设置相关](/api/admin/settings)

- **获取评论配置** `GET /admin/settings/comments` - 获取评论配置
- **更新评论配置** `PUT /admin/settings/comments` - 更新评论配置

### [邮件通知配置相关](/api/admin/email-notify)

- **获取邮件通知配置** `GET /admin/settings/email-notify` - 获取邮件通知配置
- **更新邮件通知配置** `PUT /admin/settings/email-notify` - 更新邮件通知配置
- **测试邮件发送** `POST /admin/settings/email-test` - 测试邮件通知配置是否正确

### [统计数据相关](/api/admin/stats)

- **获取评论统计数据** `GET /admin/stats/comments` - 用于管理后台「数据看板」展示评论整体统计

### [访问统计相关](/api/admin/analytics)

- **获取访问统计概览** `GET /admin/analytics/overview` - 用于管理后台「访问统计」页面展示整体访问数据
- **获取页面访问统计** `GET /admin/analytics/pages` - 用于管理后台「访问统计」页面展示各个页面的访问明细

### 点赞管理相关

- **获取点赞记录列表** `GET /admin/likes/list` - 获取各页面的点赞记录列表，支持按页面或用户筛选
- **获取点赞统计** `GET /admin/likes/stats` - 获取点赞 Top 页面列表，用于后台展示点赞排行榜

### [功能设置相关](/api/admin/feature-settings)

- **获取功能设置** `GET /admin/settings/feature` - 获取功能开关设置（评论点赞、文章点赞）
- **更新功能设置** `PUT /admin/settings/feature` - 更新功能开关设置

### [S3 备份相关](/api/admin/s3-backup)

- **获取 S3 配置** `GET /admin/settings/s3` - 获取 S3 存储配置信息
- **更新 S3 配置** `PUT /admin/settings/s3` - 更新 S3 存储配置信息
- **触发备份** `POST /admin/backup/s3` - 手动触发数据备份到 S3
- **获取备份列表** `GET /admin/backup/s3/list` - 获取 S3 存储中的备份文件列表
- **下载备份** `GET /admin/backup/s3/download` - 从 S3 下载指定的备份文件
- **删除备份** `DELETE /admin/backup/s3` - 删除 S3 存储中指定的备份文件

Source: https://cwd.js.org/api/admin/index.mdx
