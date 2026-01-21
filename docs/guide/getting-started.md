> [!WARNING]  
> ~~目前仍处于 Beta 测试阶段，欢迎反馈测试结果。~~
> 
> 目前处于内测阶段，欢迎参与测试。

# Cloudflare Workers Discuss

CWD 评论系统。

是基于 Cloudflare Workers 与全球边缘网络的免服务器、极速安全、即插即用评论系统。

[文档地址](https://cwd-docs.zishu.me)

![](https://github.com/user-attachments/assets/6ac091d8-e349-4d40-9d68-485817f63236)

## 特性

- ⚡️ **极速响应**：基于 Cloudflare 全球边缘网络
- 🔒 **安全可靠**：内置管理员认证、CORS 保护
- 🎨 **易于集成**：提供完整的 REST API
- 📧 **邮件通知**：集成各大邮箱厂商（逐步接入）

## 前置要求

- Node.js 16+
- Cloudflare 账号
- Wrangler CLI

## 安装

```bash
# 克隆项目
git clone https://github.com/anghunk/CWD

# API 项目
cd cwd-api
# 部署请查看文档

# 前端项目
cd cwd-admin
npm install

```

## 配置

- [后端配置](https://cwd-docs.zishu.me/guide/backend-config.html)
- [前端配置](https://cwd-docs.zishu.me/guide/frontend-config.html)
