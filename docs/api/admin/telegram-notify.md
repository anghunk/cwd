# Telegram 通知设置

Telegram 通知设置接口用于获取和更新 Telegram 机器人的配置，包括 Bot Token、Chat ID 以及 Webhook 设置。

所有接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

## 1.1 获取 Telegram 配置

```
GET /admin/settings/telegram
```

获取当前的 Telegram 通知配置。

- 方法：`GET`
- 路径：`/admin/settings/telegram`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
	"botToken": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
	"chatId": "123456789",
	"notifyEnabled": true
}
```

## 1.2 更新 Telegram 配置

```
PUT /admin/settings/telegram
```

更新 Telegram 通知配置。

- 方法：`PUT`
- 路径：`/admin/settings/telegram`
- 鉴权：需要（Bearer Token）

**请求体**

```json
{
	"botToken": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
	"chatId": "123456789",
	"notifyEnabled": true
}
```

## 1.3 一键设置 Webhook

```
POST /admin/settings/telegram/setup
```

自动设置 Telegram Webhook URL。此接口会使用当前 Worker 的域名构建 Webhook URL 并调用 Telegram API。

- 方法：`POST`
- 路径：`/admin/settings/telegram/setup`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
	"message": "Webhook 设置成功",
	"webhookUrl": "https://your-domain.com/api/telegram/webhook"
}
```
