---
title: "Telegram 通知与交互"
image: "https://cwd.js.org/icon.png"
---

> Documentation Index
> Fetch the complete documentation index at: https://cwd.js.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Telegram 通知与交互

系统支持通过 Telegram 机器人接收新评论通知，并在 Telegram 中对评论进行审核（批准）操作。

## 功能特性

1. **实时通知**：新评论会立即推送到指定的 Telegram 账号或群组。
2. **快捷审核**：通知消息包含“批准”按钮，无需登录后台即可审核。

## 配置步骤

1. **创建机器人**：
   - 在 Telegram 中搜索 `@BotFather`。
   - 发送 `/newbot` 命令，按照提示创建新机器人。
   - 获取 **API Token**。

2. **获取 Chat ID**：
   - 如果是个人接收，给你的机器人发送一条消息。
   - 访问 `https://api.telegram.org/bot<YourBOTToken>/getUpdates` 查看 `chat.id`。
   - 或者使用 `@userinfobot` 获取你的 ID。
   - 如果是群组，将机器人拉入群组，并获取群组 ID（通常以 `-` 开头）。

3. **后台设置**：
   - 登录评论系统后台。
   - 进入“设置” -> “Telegram 通知设置”。
   - 填入 **Bot Token** 和 **Chat ID**。
   - 开启 **Telegram 通知** 开关。
   - 点击 **保存**。
   - 点击 **一键设置 Webhook**（重要：必须执行此步骤，机器人才能接收按钮点击事件）。

## 使用说明

- **审核**：在 Telegram 中点击消息下方的“批准”按钮即可完成审核操作。

Source: https://cwd.js.org/function/telegram-notify/index.mdx
