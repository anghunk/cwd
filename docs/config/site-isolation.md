# 站点隔离

CWD 评论系统支持通过 `siteId` 参数实现多站点数据隔离。当你需要为多个不同的网站或博客使用同一套评论系统后端时，可以通过 `siteId` 来区分不同站点的评论数据。

## 功能说明

- **数据隔离**：每个 `siteId` 对应独立的评论数据，不同站点的评论互不干扰
- **统一管理**：所有站点共用同一个后端 API 和管理后台，通过 siteId 进行区分

## 前端配置

在初始化评论组件时，通过 `siteId` 参数指定站点标识：

```html
<div id="comments"></div>
<script src="https://unpkg.com/cwd-widget@0.0.x/dist/cwd.js"></script>

<script>
	const comments = new CWDComments({
		el: '#comments',
		apiBaseUrl: 'https://your-api.example.com',
		siteId: 'blog', // 站点 ID，例如：blog, docs, forum
	});
	comments.mount();
</script>
```

### 参数说明

| 参数      | 类型   | 必填 | 说明                       |
| --------- | ------ | ---- | -------------------------- |
| `siteId`  | string | 否   | 站点标识符，用于隔离不同站点的评论数据 |

### siteId 命名建议

- 使用小写字母、数字和连字符，如 `blog`、`docs`、`my-site-1`
- 避免使用特殊字符和空格
- 建议使用有意义的名称，便于识别不同站点

## API 调用

当使用站点隔离功能时，所有公开 API 请求都需要在查询参数中携带 `siteId`：

```javascript
// 获取评论列表
GET /api/comments?post_slug=hello-world&siteId=blog

// 提交评论
POST /api/comments
{
  "post_slug": "hello-world",
  "name": "张三",
  "email": "zhangsan@example.com",
  "content": "很棒的文章！"
}
// 请求头：X-Site-Id: blog

// 获取配置
GET /api/config/comments?siteId=blog
```

## 多站点示例

如果你有多个站点，可以为每个站点配置不同的 `siteId`：

```html
<!-- 博客站点 -->
<div id="blog-comments"></div>
<script>
	const blogComments = new CWDComments({
		el: '#blog-comments',
		apiBaseUrl: 'https://your-api.example.com',
		siteId: 'blog',
	});
	blogComments.mount();
</script>

<!-- 文档站点 -->
<div id="docs-comments"></div>
<script>
	const docsComments = new CWDComments({
		el: '#docs-comments',
		apiBaseUrl: 'https://your-api.example.com',
		siteId: 'docs',
	});
	docsComments.mount();
</script>
```

## 注意事项

[为什么设置完 siteId 后，评论区不显示旧的评论数据？](/common-problems.html#_1-为什么设置完-siteid-后-评论区不显示旧的评论数据)
