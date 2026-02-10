# 功能设置相关

管理各项功能开关的接口，包括点赞功能、图片灯箱预览、评论占位符、域名可见性、多语言等。

## 获取功能设置

```
GET /admin/settings/features
```

获取当前的功能开关配置。

- 方法：`GET`
- 路径：`/admin/settings/features`
- 鉴权：需要 Bearer Token

**成功响应**

- 状态码：`200`

```json
{
  "enableCommentLike": true,
  "enableArticleLike": true,
  "enableImageLightbox": true,
  "commentPlaceholder": "发表你的看法...",
  "visibleDomains": ["example.com", "blog.example.com"],
  "adminLanguage": "zh-CN",
  "widgetLanguage": "auto"
}
```

字段说明：

| 字段名               | 类型     | 说明                                                                 |
| -------------------- | -------- | -------------------------------------------------------------------- |
| `enableCommentLike`   | boolean  | 是否启用评论点赞功能                                                 |
| `enableArticleLike`   | boolean  | 是否启用文章点赞功能                                                 |
| `enableImageLightbox` | boolean  | 是否启用评论图片灯箱预览功能                                         |
| `commentPlaceholder`  | string \| null | 评论输入框的占位符文本，留空则使用默认文案                        |
| `visibleDomains`      | string[] | 允许显示评论组件的域名列表                                           |
| `adminLanguage`       | string \| null | 管理后台界面语言代码，如 `zh-CN`、`en-US`，为空则使用默认语言 |
| `widgetLanguage`      | string \| null | 评论组件默认语言代码，支持 `auto` 自动根据浏览器语言选择       |

语言相关字段说明：

- 当配置了 `adminLanguage` 时，管理后台会优先使用该语言渲染界面
- 当配置了 `widgetLanguage` 时，评论前端组件会以此作为默认语言；
  - 如果前端实例化时显式传入 `lang` 配置项，则以前端为最高优先级
  - 当前端未传入 `lang` 时，顺序为：后端 `widgetLanguage` → 自动检测浏览器语言（如 `zh-CN`/`en-US`）

## 更新功能设置

```
PUT /admin/settings/features
```

更新功能开关配置。

- 方法：`PUT`
- 路径：`/admin/settings/features`
- 鉴权：需要 Bearer Token

**请求头**

| 名称            | 必填 | 示例                 |
| --------------- | ---- | -------------------- |
| `Content-Type`  | 是   | `application/json`   |
| `Authorization` | 是   | `Bearer <token>`     |

**请求体**

```json
{
  "enableCommentLike": true,
  "enableArticleLike": true,
  "enableImageLightbox": true,
  "commentPlaceholder": "发表你的看法...",
  "visibleDomains": ["example.com", "blog.example.com"],
  "adminLanguage": "zh-CN",
  "widgetLanguage": "auto"
}
```

字段说明：

| 字段名               | 类型     | 必填 | 说明                                                                 |
| -------------------- | -------- | ---- | -------------------------------------------------------------------- |
| `enableCommentLike`   | boolean  | 否   | 是否启用评论点赞功能                                                 |
| `enableArticleLike`   | boolean  | 否   | 是否启用文章点赞功能                                                 |
| `enableImageLightbox` | boolean  | 否   | 是否启用评论图片灯箱预览功能                                         |
| `commentPlaceholder`  | string   | 否   | 评论输入框的占位符文本                                               |
| `visibleDomains`      | string[] | 否   | 允许显示评论组件的域名列表                                           |
| `adminLanguage`       | string   | 否   | 管理后台界面语言代码，留空则不修改当前配置                           |
| `widgetLanguage`      | string   | 否   | 评论组件默认语言代码，支持 `auto` 表示自动根据浏览器语言选择        |

**说明**：

- `enableImageLightbox`：启用后，评论内容中的图片可以点击放大预览
- `commentPlaceholder`：自定义评论输入框的占位符文本，留空则使用默认文本
- `visibleDomains`：设置后，只有在此列表中的域名可以正常显示评论组件，其他域名将被隐藏。留空或为 `null` 表示不限制域名
- `adminLanguage`：仅影响管理后台界面，不影响评论组件语言
- `widgetLanguage`：作为评论组件默认语言，当前端未主动传入 `lang` 时才生效

**成功响应**

- 状态码：`200`

```json
{
  "message": "保存成功！"
}
```

**错误响应**

- 状态码：`401`

```json
{
  "message": "Unauthorized"
}
```

- 状态码：`500`

```json
{
  "message": "Failed to save feature settings"
}
```
