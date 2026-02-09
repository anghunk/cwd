# 配置接口

获取评论相关的公开配置，用于前端组件读取博主邮箱、徽标等信息。

## 获取配置

```
GET /api/config/comments
```

获取评论相关的公开配置，用于前端组件读取博主邮箱、徽标等信息。

- 方法：`GET`
- 路径：`/api/config/comments`
- 鉴权：不需要

**成功响应**

- 状态码：`200`

```json
{
  "adminEmail": "admin@example.com",
  "adminBadge": "博主",
  "avatar": "https://gravatar.com/avatar",
  "adminEnabled": true,
  "allowedDomains": [],
  "requireReview": false,
  "enableCommentLike": true,
  "enableArticleLike": true,
  "enableImageLightbox": true,
  "commentPlaceholder": "发表你的看法..."
}
```

字段说明：

| 字段名               | 类型   | 说明                                                                 |
| -------------------- | ------ | -------------------------------------------------------------------- |
| `adminEmail`         | string | 博主邮箱地址，用于在前端展示"博主"标识，并触发管理员身份验证流程   |
| `adminBadge`         | string | 博主标识文字，例如 `"博主"`                                          |
| `avatarPrefix`       | string | 头像地址前缀，如 Gravatar 或 Cravatar 需像地址                      |
| `adminEnabled`       | boolean | 是否启用博主标识相关展示（关闭时不显示徽标，但仍可作为管理员邮箱） |
| `allowedDomains`     | Array\<string\> | 允许调用组件的域名列表，留空则不限制                         |
| `requireReview`       | boolean | 是否开启新评论先审核再显示（true 表示新评论默认为待审核）          |
| `enableCommentLike`   | boolean | 是否启用评论点赞功能（默认 true）                                   |
| `enableArticleLike`   | boolean | 是否启用文章点赞功能（默认 true）                                   |
| `enableImageLightbox` | boolean | 是否启用评论图片灯箱预览功能（默认 false）                          |
| `commentPlaceholder`   | string \| null | 评论输入框的占位符文本，留空则使用默认值                     |

**错误响应**

- 状态!码：`500`

```json
{
  "message": "加载评论配置失败"
}
```
