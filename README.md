> [!WARNING]  
> 目前仍处于 Beta 测试阶段，欢迎反馈测试结果。

<img src="https://github.com/anghunk/cwd-comments/blob/main/icon.png?raw=true" width="72" />

# cwd-comments

Cloudflare Worker 版本基于 Cloudflare Workers + D1 + KV 实现，无需服务器即可部署运行的评论组件。

[文档地址](https://cwd-comments-docs.zishu.me)

## 特性

- ⚡️ **极速响应**：基于 Cloudflare 全球边缘网络
- 🔒 **安全可靠**：内置管理员认证、CORS 保护
- 🎨 **易于集成**：提供完整的 REST API

**开发中：**
~~- [ ]📧 **邮件通知**：基于 Cloudflare Workers 发送邮件~~ Cloudflare Workers 不支持给第三方自动发信，下一步开发基于邮箱提供商的发信系统。

## 前置要求

- Node.js 16+
- Cloudflare 账号
- Wrangler CLI

## 安装

```bash
# 克隆项目
git clone https://github.com/anghunk/cwd-comments

# API 项目
cd cwd-comments-api
# 部署请查看文档

# 前端项目
cd cwd-comments-web
npm install

```

## 配置

- [后端配置](https://cwd-comments-docs.zishu.me/guide/backend-config.html)
- [前端配置](https://cwd-comments-docs.zishu.me/guide/frontend-config.html)
