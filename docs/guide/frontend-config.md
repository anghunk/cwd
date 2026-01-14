# 前端配置

**这里仅提供一套开箱即用的方案，如果是个人开发者可以根据 API 文档自行编写前端评论组件。**

[接口 API](../api/public.md)

## 初始化

在初始化 `CWDComments` 实例时，可以传入以下配置参数：

```html
<script src="https://cwd-comments.zishu.me/cwd-comments.js"></script>
```

```html
<script>
  const comments = new CWDComments({
    el: '#comments', // 容器 id
    apiBaseUrl: 'https://your-api.example.com', // 你部署的api地址
    postSlug: 'my-post', // 当前页面路径，可使用博客程序支持的 url 模板路径
  });
  comments.mount();
</script>
```

## 参数说明

| 参数           | 类型                    | 必填 | 默认值                        | 说明                       |
| -------------- | ----------------------- | ---- | ----------------------------- | -------------------------- |
| `el`           | `string \| HTMLElement` | 是   | -                             | 挂载元素选择器或 DOM 元素  |
| `apiBaseUrl`   | `string`                | 是   | -                             | API 基础地址               |
| `postSlug`     | `string`                | 是   | -                             | 文章唯一标识符             |
| `postTitle`    | `string`                | 否   | -                             | 文章标题，用于邮件通知     |
| `postUrl`      | `string`                | 否   | -                             | 文章 URL，用于邮件通知     |
| `theme`        | `'light' \| 'dark'`     | 否   | `'light'`                     | 主题模式                   |
| `pageSize`     | `number`                | 否   | `20`                          | 每页显示评论数             |
| `avatarPrefix` | `string`                | 否   | `https://gravatar.com/avatar` | 头像服务前缀               |
| `adminEmail`   | `string`                | 否   | -                             | 博主邮箱，用于显示博主标识 |
| `adminBadge`   | `string`                | 否   | `博主`                        | 博主标识文字               |

## 头像服务前缀

常用的 Gravatar 镜像服务：

| 服务            | 前缀地址                         |
| --------------- | -------------------------------- |
| Gravatar 官方   | `https://gravatar.com/avatar`    |
| Cravatar (国内) | `https://cravatar.cn/avatar`     |
| 自定义镜像      | `https://your-mirror.com/avatar` |

## 实例方法

| 方法                   | 说明                           |
| ---------------------- | ------------------------------ |
| `mount()`              | 挂载组件到 DOM                 |
| `unmount()`            | 卸载组件                       |
| `updateConfig(config)` | 更新配置（支持动态切换主题等） |
| `getConfig()`          | 获取当前配置                   |

## 使用示例

```javascript
// 动态切换主题
comments.updateConfig({ theme: 'dark' });

// 切换文章
comments.updateConfig({ postSlug: 'another-post' });
```
