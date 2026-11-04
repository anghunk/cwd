---
title: "Cloudflare Workers Discuss"
image: "https://cwd.js.org/icon.png"
---

> Documentation Index
> Fetch the complete documentation index at: https://cwd.js.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Cloudflare Workers Discuss

**CWD 评论系统** 是基于 Cloudflare Workers 与全球边缘网络的免服务器、极速安全、即插即用评论系统。

数据存储在 Cloudflare D1 数据库中，通过 Worker 与数据库交互。根据对 Cloudflare 免费计划的分析，CWD 评论系统的部署成本为零，不需要任何成本。

**指标分析：** 你可以根据你的站点日常承接能力，确认选择使用该评论系统。

| 指标   | 免费每日额度 | 单次消耗     | 理论极限         |
| ------ | ------------ | ------------ | ---------------- |
| 行读取 | 500 万       | ~5 次/次访问 | 100 万次页面访问 |
| 行写入 | 10 万        | ~2 次/次访问 | 5 万次页面访问   |
| 存储   | 5GB          | 1-2KB/评论   | 250 万 + 评论    |

:::note[因此请放心：]
对于个人博客或中小型站点来说，免费计划完全够用。
:::

## 特性

- ⚡️ **极速响应**：基于 Cloudflare 全球边缘网络
- 🔒 **安全可靠**：内置管理员认证、CORS 保护等
- 🎨 **易于集成**：提供完整的 REST API，支持定制前端评论组件
- 🔧 **管理后台**：提供完善的后台管理界面，方便评论管理
- 🔄 **评论审核**：支持手动审核评论，防止垃圾评论
- 🔒 **禁止评论**：支持屏蔽 IP 和拉黑邮箱
- 📧 **邮件通知**：集成各大邮箱厂商（逐步接入），支持自定义通知模板
- 🔄 **评论迁移**：支持将其他评论系统的评论迁移到 CWD
- 🎨 **外观设计**：优雅简洁的 UI 设计，支持自定义主题/黑夜模式等

**评论端**
![](https://github.com/user-attachments/assets/34096ce5-512d-4ddb-b409-edef6a2674ed)

**后台管理**
![](https://github.com/user-attachments/assets/7592e339-3a4f-4dd2-a71c-ff6d97621fd9)
![](https://github.com/user-attachments/assets/59ef1a42-75f7-4efa-8a0c-beae71322484)
![](https://github.com/user-attachments/assets/2bffdfaf-4af4-4bd8-929f-a178bc4acb78)
![](https://github.com/user-attachments/assets/37cff92b-d6c7-4d1e-a9dd-856bac6ec8d3)

## 前置要求

- Node.js 20+
- Cloudflare 账号
- Wrangler CLI

## 安装

```bash
# 克隆项目
git clone https://github.com/anghunk/cwd

# API 项目
cd cwd-api
# 部署请查看文档

# 前端项目
cd cwd-admin
npm install

```

## 配置

- [后端配置](/guide/backend-config)
- [前端配置](/guide/frontend-config)

Source: https://cwd.js.org/guide/getting-started/index.mdx
