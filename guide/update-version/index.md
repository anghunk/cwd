---
title: "更新部署"
image: "https://cwd.js.org/icon.png"
---

> Documentation Index
> Fetch the complete documentation index at: https://cwd.js.org/llms.txt
> Use this file to discover all available pages before exploring further.

# 更新部署

重新拉取 GitHub 项目代码。

## 后端更新

接口逻辑相关的更新，需要重新部署到 Cloudflare Workers.

```
cd cwd-api
npm install
npm run deploy
```

重新部署到 Cloudflare Workers.

## 前端更新

如果你的管理后台项目，是通过 GitHub 仓库部署到 Cloudflare Pages，不需要手动更新，只用拉取官方仓库代码，重新推送即可触发重新部署（无需手动）。

### 管理后台

如果使用官方后台不需要更新。

:::warning
存在一个弊端，如果官方后台版本有了大更新，而你部署的 api 端没有及时更新部署，可能会导致管理后台无法正常使用（无法获取到最新的接口），正常情况下无需担心。
:::

```
cd cwd-admin
npm install
npm run build
```

将打包后的代码更新到你托管的地方（例如 Cloudflare Pages、GitHub Pages、Netlify 等）。  

### 评论端

更新 api 时同步修改引入文件的版本号，源码文件 `/docs/widget`.

Source: https://cwd.js.org/guide/update-version/index.mdx
