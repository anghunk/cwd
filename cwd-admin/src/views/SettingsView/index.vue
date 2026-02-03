<template>
  <div class="page">
    <h2 class="page-title">网站设置</h2>
    <div
      v-if="toastVisible"
      class="toast"
      :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
    >
      {{ toastMessage }}
    </div>
    <div v-if="loading" class="page-hint">加载中...</div>
    <div v-else>
      <div class="settings-tabs">
        <button
          type="button"
          class="settings-tab"
          :class="{ 'settings-tab-active': activeTab === 'comment' }"
          @click="activeTab = 'comment'"
        >
          评论与安全
        </button>
        <button
          type="button"
          class="settings-tab"
          :class="{ 'settings-tab-active': activeTab === 'feature' }"
          @click="activeTab = 'feature'"
        >
          功能开关
        </button>
        <button
          type="button"
          class="settings-tab"
          :class="{ 'settings-tab-active': activeTab === 'display' }"
          @click="activeTab = 'display'"
        >
          后台显示
        </button>
        <button
          type="button"
          class="settings-tab"
          :class="{ 'settings-tab-active': activeTab === 'emailNotify' }"
          @click="activeTab = 'emailNotify'"
        >
          邮箱提醒
        </button>
        <button
          type="button"
          class="settings-tab"
          :class="{ 'settings-tab-active': activeTab === 'telegramNotify' }"
          @click="activeTab = 'telegramNotify'"
        >
          Telegram 通知
        </button>
      </div>
      <transition name="tab-fade" mode="out-in">
        <div :key="activeTab">
          <template v-if="activeTab === 'comment'">
            <div class="card">
              <div class="card-header">
                <div class="card-title">评论显示配置</div>
              </div>
              <div class="card-body">
                <div class="form-item">
                  <label class="form-label">管理员邮箱</label>
                  <input v-model="commentAdminEmail" class="form-input" type="email" />
                </div>
                <div class="form-item">
                  <label class="form-label">博主标签文字（留空使用默认图标）</label>
                  <input v-model="commentAdminBadge" class="form-input" type="text" />
                </div>
                <div class="form-item">
                  <label class="form-label">是否开启博主标签显示</label>
                  <label class="switch">
                    <input v-model="commentAdminEnabled" type="checkbox" />
                    <span class="slider" />
                  </label>
                </div>
                <div class="form-item">
                  <label class="form-label"
                    >头像前缀（默认：https://gravatar.com/avatar）</label
                  >
                  <input v-model="avatarPrefix" class="form-input" type="text" />
                </div>
                <h3 class="card-title">安全设置</h3>
                <div class="form-item">
                  <label class="form-label">新评论是否审核后再显示</label>
                  <label class="switch">
                    <input v-model="requireReview" type="checkbox" />
                    <span class="slider" />
                  </label>
                </div>
                <div class="form-item">
                  <label class="form-label">
                    管理员评论密钥（设置后前台使用管理员邮箱评论需输入此密钥。）
                  </label>

                  <input
                    v-model="commentAdminKey"
                    class="form-input"
                    placeholder="输入密钥以设置或修改"
                    autocomplete="new-password"
                  />
                </div>
                <div class="form-item">
                  <label class="form-label">
                    允许调用的域名（设置后仅匹配域名可调用前台评论组件，留空则不限制。使用空格或者逗号进行分割。）
                  </label>
                  <div class="tag-input">
                    <div class="tag-input-inner">
                      <span
                        v-for="domain in allowedDomainTags"
                        :key="domain"
                        class="tag-input-tag"
                      >
                        <span class="tag-input-tag-text">{{ domain }}</span>
                        <button
                          type="button"
                          class="tag-input-tag-remove"
                          @click="removeAllowedDomain(domain)"
                        >
                          <PhTrash :size="14" />
                        </button>
                      </span>
                      <input
                        v-model="allowedDomainInput"
                        class="tag-input-input"
                        @keyup="handleAllowedDomainKeyup"
                        @blur="handleAllowedDomainBlur"
                      />
                    </div>
                  </div>
                </div>
                <div class="form-item">
                  <label class="form-label">
                    IP 黑名单（多个 IP 用逗号或换行分隔，留空则不限制）
                  </label>
                  <div class="tag-input">
                    <div class="tag-input-inner">
                      <span v-for="ip in blockedIpTags" :key="ip" class="tag-input-tag">
                        <span class="tag-input-tag-text">{{ ip }}</span>
                        <button
                          type="button"
                          class="tag-input-tag-remove"
                          @click="removeBlockedIp(ip)"
                        >
                          <PhTrash :size="14" />
                        </button>
                      </span>
                      <input
                        v-model="blockedIpInput"
                        class="tag-input-input"
                        @keyup="handleBlockedIpKeyup"
                        @blur="handleBlockedIpBlur"
                      />
                    </div>
                  </div>
                </div>
                <div class="form-item">
                  <label class="form-label"
                    >邮箱黑名单（多个邮箱用逗号或换行分隔，留空则不限制）</label
                  >
                  <div class="tag-input">
                    <div class="tag-input-inner">
                      <span
                        v-for="email in blockedEmailTags"
                        :key="email"
                        class="tag-input-tag"
                      >
                        <span class="tag-input-tag-text">{{ email }}</span>
                        <button
                          type="button"
                          class="tag-input-tag-remove"
                          @click="removeBlockedEmail(email)"
                        >
                          <PhTrash :size="14" />
                        </button>
                      </span>
                      <input
                        v-model="blockedEmailInput"
                        class="tag-input-input"
                        @keyup="handleBlockedEmailKeyup"
                        @blur="handleBlockedEmailBlur"
                      />
                    </div>
                  </div>
                </div>

                <div class="card-actions">
                  <button
                    class="card-button"
                    :disabled="savingComment"
                    @click="saveComment"
                  >
                    <span v-if="savingComment">保存中...</span>
                    <span v-else>保存</span>
                  </button>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="activeTab === 'feature'">
            <div class="card">
              <div class="card-header">
                <div class="card-title">功能开关</div>
              </div>
              <div class="card-body">
                <div class="form-item">
                  <label class="form-label">开启文章点赞功能</label>
                  <label class="switch">
                    <input v-model="enableArticleLike" type="checkbox" />
                    <span class="slider" />
                  </label>
                  <div class="form-hint">
                    开启后，评论区顶部会显示的文章点赞（喜欢）按钮。
                  </div>
                </div>
                <div class="form-item">
                  <label class="form-label">开启评论点赞功能</label>
                  <label class="switch">
                    <input v-model="enableCommentLike" type="checkbox" />
                    <span class="slider" />
                  </label>
                  <div class="form-hint">
                    开启后，评论列表中的每条评论都会显示点赞按钮。
                  </div>
                </div>
                <div class="card-actions">
                  <button
                    class="card-button"
                    :disabled="savingFeature"
                    @click="saveFeature"
                  >
                    <span v-if="savingFeature">保存中...</span>
                    <span v-else>保存</span>
                  </button>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="activeTab === 'display'">
            <div class="card">
              <div class="card-header">
                <div class="card-title">后台显示设置</div>
              </div>
              <div class="card-body">
                <div class="form-item">
                  <label class="form-label">后台标题</label>
                  <input
                    v-model="adminLayoutTitle"
                    class="form-input"
                    type="text"
                    placeholder="CWD 评论系统"
                  />
                  <div class="form-hint">显示在后台顶部导航栏左侧。</div>
                </div>
                <div class="card-actions">
                  <button
                    class="card-button"
                    :disabled="savingDisplay"
                    @click="saveDisplay"
                  >
                    <span v-if="savingDisplay">保存中...</span>
                    <span v-else>保存</span>
                  </button>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="activeTab === 'emailNotify'">
            <div class="card">
              <div class="card-header">
                <div class="card-title">通知邮箱设置</div>
              </div>
              <div class="card-body">
                <div class="form-item">
                  <label class="form-label">开启邮件通知</label>
                  <label class="switch">
                    <input v-model="emailGlobalEnabled" type="checkbox" />
                    <span class="slider" />
                  </label>
                </div>

                <div class="divider"></div>
                <h4 class="card-subtitle">1. SMTP 发件配置</h4>

                <div class="form-item">
                  <label class="form-label">邮件服务商</label>
                  <select
                    v-model="smtpProvider"
                    class="form-input"
                    @change="onProviderChange"
                  >
                    <option value="qq">QQ 邮箱</option>
                    <option value="custom">自定义 SMTP</option>
                  </select>
                </div>

                <div v-if="smtpProvider === 'custom'">
                  <div class="form-item">
                    <label class="form-label">SMTP 服务器</label>
                    <input
                      v-model="smtpHost"
                      class="form-input"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div class="form-item">
                    <label class="form-label">SMTP 端口</label>
                    <input
                      v-model="smtpPort"
                      class="form-input"
                      type="number"
                      placeholder="465"
                    />
                  </div>
                  <div class="form-item">
                    <label class="form-label">SSL 安全连接</label>
                    <label class="switch">
                      <input v-model="smtpSecure" type="checkbox" />
                      <span class="slider" />
                    </label>
                  </div>
                </div>

                <div class="form-item">
                  <label class="form-label">发件邮箱账号</label>
                  <input
                    v-model="smtpUser"
                    class="form-input"
                    placeholder="例如: 123456@qq.com"
                  />
                </div>
                <div class="form-item">
                  <label class="form-label">授权码/密码</label>
                  <input
                    v-model="smtpPass"
                    class="form-input"
                    type="text"
                    placeholder="QQ邮箱请使用授权码"
                  />
                  <div v-if="smtpProvider === 'qq'" class="form-hint">
                    注意：QQ 邮箱必须使用<a
                      href="https://service.mail.qq.com/detail/0/75"
                      target="_blank"
                      >授权码</a
                    >，而非 QQ 密码。<br />
                    请登录 QQ 邮箱网页版，在【设置 - 账户】中开启 POP3/SMTP
                    服务并生成授权码。
                  </div>
                </div>

                <div class="divider"></div>
                <h4 class="card-subtitle">2. 邮件模板设置</h4>

                <div class="form-item">
                  <label class="form-label">管理员通知模板 (HTML)</label>
                  <div class="form-hint">
                    可用变量：${commentAuthor} (评论人昵称), ${postTitle} (文章标题),
                    ${postUrl} (文章链接), ${commentContent} (评论内容)
                  </div>
                  <textarea
                    v-model="templateAdmin"
                    class="form-input"
                    rows="10"
                    placeholder="留空则使用默认模板"
                  ></textarea>
                </div>

                <div class="form-item">
                  <label class="form-label">回复通知模板 (HTML)</label>
                  <div class="form-hint">
                    可用变量：${toName} (接收人昵称), ${replyAuthor} (回复人昵称),
                    ${postTitle} (文章标题), ${postUrl} (文章链接), ${parentComment}
                    (原评论), ${replyContent} (回复内容)
                  </div>
                  <textarea
                    v-model="templateReply"
                    class="form-input"
                    rows="10"
                    placeholder="留空则使用默认模板"
                  ></textarea>
                </div>

                <div
                  v-if="message && messageType === 'error'"
                  class="form-message form-message-error"
                >
                  {{ message }}
                </div>
                <div class="card-actions" style="justify-content: space-between">
                  <button
                    class="card-button secondary"
                    :disabled="testingEmail"
                    @click="testEmail"
                  >
                    <span v-if="testingEmail">发送中...</span>
                    <span v-else>发送测试邮件</span>
                  </button>
                  <button
                    class="card-button secondary"
                    style="margin-left: auto"
                    @click="resetTemplatesToDefault"
                  >
                    恢复默认模板
                  </button>
                  <button class="card-button" :disabled="savingEmail" @click="saveEmail">
                    <span v-if="savingEmail">保存中...</span>
                    <span v-else>保存配置</span>
                  </button>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="activeTab === 'telegramNotify'">
            <div class="card">
              <div class="card-header">
                <div class="card-title">Telegram 通知设置</div>
              </div>
              <div class="card-body">
                <div class="form-item">
                  <label class="form-label">开启 Telegram 通知</label>
                  <label class="switch">
                    <input v-model="telegramNotifyEnabled" type="checkbox" />
                    <span class="slider" />
                  </label>
                </div>
                <div class="form-item">
                  <label class="form-label">Bot Token</label>
                  <input
                    v-model="telegramBotToken"
                    class="form-input"
                    type="text"
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  />
                  <div class="form-hint">
                    在 Telegram 中搜索
                    <a href="https://t.me/BotFather" target="_blank">@BotFather</a>
                    创建机器人获取 Token
                  </div>
                </div>
                <div class="form-item">
                  <label class="form-label">Chat ID</label>
                  <input
                    v-model="telegramChatId"
                    class="form-input"
                    type="text"
                    placeholder="123456789"
                  />
                  <div class="form-hint">
                    这是接收通知的用户 ID 或群组 ID。可以先给机器人发消息，然后通过 API
                    获取 ID，或者使用
                    <a href="https://t.me/userinfobot" target="_blank">@userinfobot</a>
                    查询。
                  </div>
                </div>

                <div class="card-actions" style="justify-content: space-between">
                  <button
                    class="card-button secondary"
                    :disabled="settingUpWebhook"
                    @click="doSetupWebhook"
                  >
                    <span v-if="settingUpWebhook">设置中...</span>
                    <span v-else>一键设置 Webhook</span>
                  </button>
                  <button
                    class="card-button secondary"
                    :disabled="testingTelegram"
                    @click="testTelegram"
                    style="margin-right: auto"
                  >
                    <span v-if="testingTelegram">发送中...</span>
                    <span v-else>发送测试消息</span>
                  </button>
                  <button
                    class="card-button"
                    :disabled="savingTelegram"
                    @click="saveTelegram"
                  >
                    <span v-if="savingTelegram">保存中...</span>
                    <span v-else>保存</span>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, type Ref } from "vue";
import {
  fetchCommentSettings,
  saveCommentSettings,
  fetchEmailNotifySettings,
  saveEmailNotifySettings,
  sendTestEmail,
        fetchFeatureSettings,
        saveFeatureSettings,
        fetchAdminDisplaySettings,
        saveAdminDisplaySettings,
  fetchTelegramSettings,
  saveTelegramSettings,
  setupTelegramWebhook,
  sendTelegramTestMessage,
} from "../../api/admin";

const DEFAULT_REPLY_TEMPLATE = `<div style="background-color:#f4f4f5;padding:24px 0;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111827;">
        <div style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#2563eb,#4f46e5);">
          <h1 style="margin:0;font-size:18px;line-height:1.4;color:#f9fafb;">评论回复 - \${postTitle}</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#e5e7eb;">你在文章下的评论收到了新的回复</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 8px 0;font-size:14px;color:#374151;">Hi <span style="font-weight:600;">\${toName}</span>，</p>
          <p style="margin:0 0 16px 0;font-size:14px;color:#4b5563;">
            <span style="font-weight:600;">\${replyAuthor}</span> 回复了你在
            <span style="font-weight:600;">《\${postTitle}》</span>
            中的评论：
          </p>
          <div style="margin:0 0 18px 0;padding:14px 16px;border-radius:10px;background:#f3f4f6;border:1px solid #e5e7eb;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">你之前的评论</div>
            <div style="font-size:14px;color:#374151;">\${parentComment}</div>
          </div>
          <div style="margin:0 0 24px 0;padding:14px 16px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;">
            <div style="font-size:12px;color:#1d4ed8;margin-bottom:6px;">最新回复</div>
            <div style="font-size:14px;color:#1f2937;">\${replyContent}</div>
          </div>
          <div style="text-align:center;margin-bottom:8px;">
            <a href="\${postUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#2563eb;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;">
              打开文章查看完整对话
            </a>
          </div>
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            如果按钮无法点击，可以将链接复制到浏览器中打开：<br />
            <span style="word-break:break-all;color:#6b7280;">\${postUrl}</span>
          </p>
        </div>
        <div style="padding:14px 20px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
          <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">
            此邮件由系统自动发送，请勿直接回复。
          </p>
        </div>
      </div>
    </div>
  `;

const DEFAULT_ADMIN_TEMPLATE = `<div style="background-color:#f4f4f5;padding:24px 0;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111827;">
        <div style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#0f766e,#059669);">
          <h1 style="margin:0;font-size:18px;line-height:1.4;color:#f9fafb;">新评论提醒</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#d1fae5;">你的文章收到了新的评论</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 10px 0;font-size:14px;color:#374151;">
            <span style="font-weight:600;">\${commentAuthor}</span> 在文章
            <span style="font-weight:600;">《\${postTitle}》</span>
            下发表了新评论：
          </p>
          <div style="margin:0 0 18px 0;padding:14px 16px;border-radius:10px;background:#f9fafb;border:1px solid #e5e7eb;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">评论内容</div>
            <div style="font-size:14px;color:#374151;">\${commentContent}</div>
          </div>
          <div style="margin:0 0 8px 0;">
            <a href="\${postUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#047857;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;">
              打开后台查看并管理评论
            </a>
          </div>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            如果按钮无法点击，可以将链接复制到浏览器中打开：<br />
            <span style="word-break:break-all;color:#6b7280;">\${postUrl}</span>
          </p>
        </div>
        <div style="padding:14px 20px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
          <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">
            此邮件由系统自动发送，如非本人操作可忽略本邮件。
          </p>
        </div>
      </div>
    </div>
  `;

const emailGlobalEnabled = ref(true);
const commentAdminEmail = ref("");
const commentAdminBadge = ref("");
const avatarPrefix = ref("");
const commentAdminEnabled = ref(false);
const adminLayoutTitle = ref("CWD 评论系统");
const allowedDomainTags = ref<string[]>([]);
const allowedDomainInput = ref("");
const blockedIpTags = ref<string[]>([]);
const blockedIpInput = ref("");
const blockedEmailTags = ref<string[]>([]);
const blockedEmailInput = ref("");
const commentAdminKey = ref("");
const adminKeySet = ref(false);
const requireReview = ref(false);
const enableArticleLike = ref(true);
const enableCommentLike = ref(true);
const telegramBotToken = ref("");
const telegramChatId = ref("");
const telegramNotifyEnabled = ref(false);
const savingTelegram = ref(false);
const settingUpWebhook = ref(false);
const testingTelegram = ref(false);

const activeTab = ref<"comment" | "feature" | "display" | "emailNotify" | "telegramNotify">(
  "comment",
);

function addAllowedDomainsFromInput() {
  const raw = allowedDomainInput.value;
  if (!raw) {
    return;
  }
  const parts = raw
    .split(/[,，\s]+/)
    .map((d) => d.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    allowedDomainInput.value = "";
    return;
  }
  const existing = new Set(allowedDomainTags.value);
  for (const part of parts) {
    if (!existing.has(part)) {
      allowedDomainTags.value.push(part);
      existing.add(part);
    }
  }
  allowedDomainInput.value = "";
}

function handleAllowedDomainKeyup(event: KeyboardEvent) {
  if (
    event.key === " " ||
    event.key === "Spacebar" ||
    event.key === "," ||
    event.key === "，" ||
    event.key === "Enter"
  ) {
    addAllowedDomainsFromInput();
  }
}

function handleAllowedDomainBlur() {
  addAllowedDomainsFromInput();
}

function removeAllowedDomain(domain: string) {
  allowedDomainTags.value = allowedDomainTags.value.filter((d) => d !== domain);
}

function addBlockedIpFromInput() {
  const raw = blockedIpInput.value;
  if (!raw) {
    return;
  }
  const parts = raw
    .split(/[,，\s]+/)
    .map((d) => d.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    blockedIpInput.value = "";
    return;
  }
  const existing = new Set(blockedIpTags.value);
  for (const part of parts) {
    if (!existing.has(part)) {
      blockedIpTags.value.push(part);
      existing.add(part);
    }
  }
  blockedIpInput.value = "";
}

function handleBlockedIpKeyup(event: KeyboardEvent) {
  if (
    event.key === " " ||
    event.key === "Spacebar" ||
    event.key === "," ||
    event.key === "，" ||
    event.key === "Enter"
  ) {
    addBlockedIpFromInput();
  }
}

function handleBlockedIpBlur() {
  addBlockedIpFromInput();
}

function removeBlockedIp(ip: string) {
  blockedIpTags.value = blockedIpTags.value.filter((t) => t !== ip);
}

function addBlockedEmailFromInput() {
  const raw = blockedEmailInput.value;
  if (!raw) {
    return;
  }
  const parts = raw
    .split(/[,，\s]+/)
    .map((d) => d.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    blockedEmailInput.value = "";
    return;
  }
  const existing = new Set(blockedEmailTags.value);
  for (const part of parts) {
    if (!existing.has(part)) {
      blockedEmailTags.value.push(part);
      existing.add(part);
    }
  }
  blockedEmailInput.value = "";
}

function handleBlockedEmailKeyup(event: KeyboardEvent) {
  if (
    event.key === " " ||
    event.key === "Spacebar" ||
    event.key === "," ||
    event.key === "，" ||
    event.key === "Enter"
  ) {
    addBlockedEmailFromInput();
  }
}

function handleBlockedEmailBlur() {
  addBlockedEmailFromInput();
}

function removeBlockedEmail(email: string) {
  blockedEmailTags.value = blockedEmailTags.value.filter((t) => t !== email);
}

const savingEmail = ref(false);
const testingEmail = ref(false);
const savingComment = ref(false);
const savingFeature = ref(false);
const savingDisplay = ref(false);
const loading = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);

// 从本地存储加载卡片展开状态，默认只展开第一个卡片
const STORAGE_KEY = "settings-cards-expanded";
function loadCardsExpanded() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        comment: parsed.comment ?? true,
        display: parsed.display ?? false,
        feature: parsed.feature ?? false,
        email: parsed.email ?? false,
        telegram: parsed.telegram ?? false,
      };
    }
  } catch {
  }
  return { comment: true, display: false, feature: false, email: false, telegram: false };
}

const cardsExpanded = ref(loadCardsExpanded());

function saveCardsExpanded() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cardsExpanded.value));
  } catch {
    // 忽略错误
  }
}

function toggleCard(card: keyof typeof cardsExpanded.value) {
  cardsExpanded.value[card] = !cardsExpanded.value[card];
  saveCardsExpanded();
}

const smtpProvider = ref("qq");
const smtpHost = ref("smtp.qq.com");
const smtpPort = ref(465);
const smtpUser = ref("");
const smtpPass = ref("");
const smtpSecure = ref(true);
const templateAdmin = ref(DEFAULT_ADMIN_TEMPLATE);
const templateReply = ref(DEFAULT_REPLY_TEMPLATE);

function onProviderChange() {
  if (smtpProvider.value === "qq") {
    smtpHost.value = "smtp.qq.com";
    smtpPort.value = 465;
    smtpSecure.value = true;
  }
}

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  window.setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
}

function resetTemplatesToDefault() {
  templateAdmin.value = DEFAULT_ADMIN_TEMPLATE;
  templateReply.value = DEFAULT_REPLY_TEMPLATE;
}

async function load() {
  loading.value = true;
  try {
    const [commentRes, emailNotifyRes, featureRes, telegramRes, displayRes] = await Promise.all([
      fetchCommentSettings(),
      fetchEmailNotifySettings(),
      fetchFeatureSettings(),
      fetchTelegramSettings(),
      fetchAdminDisplaySettings(),
    ]);
    commentAdminEmail.value = commentRes.adminEmail || "";
    commentAdminBadge.value = commentRes.adminBadge ?? "";
    avatarPrefix.value = commentRes.avatarPrefix || "";
    commentAdminEnabled.value = !!commentRes.adminEnabled;
    const domains = Array.isArray(commentRes.allowedDomains)
      ? commentRes.allowedDomains
      : [];
    allowedDomainTags.value = domains
      .map((d: string) => String(d).trim())
      .filter(Boolean);
    allowedDomainInput.value = "";
    blockedIpTags.value = Array.isArray(commentRes.blockedIps)
      ? commentRes.blockedIps
      : [];
    blockedIpInput.value = "";
    blockedEmailTags.value = Array.isArray(commentRes.blockedEmails)
      ? commentRes.blockedEmails
      : [];
    blockedEmailInput.value = "";
    commentAdminKey.value = commentRes.adminKey || "";
    adminKeySet.value = !!commentRes.adminKeySet;
    requireReview.value = !!commentRes.requireReview;
    emailGlobalEnabled.value = !!emailNotifyRes.globalEnabled;
    enableArticleLike.value = featureRes.enableArticleLike;
    enableCommentLike.value = featureRes.enableCommentLike;

    telegramBotToken.value = telegramRes.botToken || "";
    telegramChatId.value = telegramRes.chatId || "";
    telegramNotifyEnabled.value = telegramRes.notifyEnabled;

    adminLayoutTitle.value = displayRes.layoutTitle || "CWD 评论系统";

    if (emailNotifyRes.templates) {
      templateAdmin.value = emailNotifyRes.templates.admin || DEFAULT_ADMIN_TEMPLATE;
      templateReply.value = emailNotifyRes.templates.reply || DEFAULT_REPLY_TEMPLATE;
    } else {
      templateAdmin.value = DEFAULT_ADMIN_TEMPLATE;
      templateReply.value = DEFAULT_REPLY_TEMPLATE;
    }

    if (emailNotifyRes.smtp) {
      smtpHost.value = emailNotifyRes.smtp.host;
      smtpPort.value = emailNotifyRes.smtp.port;
      smtpUser.value = emailNotifyRes.smtp.user;
      smtpPass.value = emailNotifyRes.smtp.pass;
      smtpSecure.value = emailNotifyRes.smtp.secure;

      if (emailNotifyRes.smtp.host === "smtp.qq.com") {
        smtpProvider.value = "qq";
      } else {
        smtpProvider.value = "custom";
      }
    }
  } catch (e: any) {
    message.value = e.message || "加载失败";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
}

async function saveEmail() {
  savingEmail.value = true;
  message.value = "";
  try {
    const res = await saveEmailNotifySettings({
      globalEnabled: emailGlobalEnabled.value,
      smtp: {
        host: smtpHost.value,
        port: smtpPort.value,
        user: smtpUser.value,
        pass: smtpPass.value,
        secure: smtpSecure.value,
      },
      templates: {
        reply: templateReply.value,
        admin: templateAdmin.value,
      },
    });
    showToast(res.message || "保存成功", "success");
  } catch (e: any) {
    message.value = e.message || "保存失败";
    messageType.value = "error";
  } finally {
    savingEmail.value = false;
  }
}

async function testEmail() {
  if (!commentAdminEmail.value) {
    message.value = "请先在上方“评论显示配置”中设置管理员邮箱";
    messageType.value = "error";
    return;
  }
  if (!smtpUser.value || !smtpPass.value) {
    message.value = "请先填写 SMTP 账号和密码";
    messageType.value = "error";
    return;
  }

  testingEmail.value = true;
  message.value = "";
  try {
    const res = await sendTestEmail({
      toEmail: commentAdminEmail.value,
      smtp: {
        host: smtpHost.value,
        port: smtpPort.value,
        user: smtpUser.value,
        pass: smtpPass.value,
        secure: smtpSecure.value,
      },
    });
    showToast(res.message || "发送成功，请查收邮件", "success");
  } catch (e: any) {
    // 显示详细错误信息
    console.error(e);
    let errorMsg = e.message || "发送失败";

    // 针对 QQ 邮箱 535 错误的友好提示
    if (
      errorMsg.includes("535") &&
      (errorMsg.includes("Login fail") || errorMsg.includes("authentication failed"))
    ) {
      errorMsg =
        "验证失败 (535)：请检查 1. QQ 邮箱是否已开启 POP3/SMTP 服务；2. 密码栏是否填写了“授权码”（非 QQ 密码）。";
    }

    message.value = errorMsg;
    messageType.value = "error";
  } finally {
    testingEmail.value = false;
  }
}

async function saveComment() {
  savingComment.value = true;
  message.value = "";
  try {
    const [commentRes] = await Promise.all([
      saveCommentSettings({
        adminEmail: commentAdminEmail.value,
        adminBadge: commentAdminBadge.value,
        avatarPrefix: avatarPrefix.value,
        adminEnabled: commentAdminEnabled.value,
        allowedDomains: allowedDomainTags.value,
        adminKey: commentAdminKey.value || undefined,
        requireReview: requireReview.value,
        blockedIps: blockedIpTags.value,
        blockedEmails: blockedEmailTags.value,
      }),
    ]);

    showToast(commentRes.message || "保存成功", "success");
  } catch (e: any) {
    message.value = e.message || "保存失败";
    messageType.value = "error";
  } finally {
    savingComment.value = false;
  }
}

async function saveFeature() {
  savingFeature.value = true;
  message.value = "";
  try {
    const [featureRes] = await Promise.all([
      saveFeatureSettings({
        enableArticleLike: enableArticleLike.value,
        enableCommentLike: enableCommentLike.value,
      }),
    ]);

    showToast(featureRes.message || "保存成功", "success");
  } catch (e: any) {
    message.value = e.message || "保存失败";
    messageType.value = "error";
  } finally {
    savingFeature.value = false;
  }
}

async function saveDisplay() {
  savingDisplay.value = true;
  message.value = "";
  try {
    const res = await saveAdminDisplaySettings({
      layoutTitle: adminLayoutTitle.value,
    });

    showToast(res.message || "保存成功", "success");
  } catch (e: any) {
    message.value = e.message || "保存失败";
    messageType.value = "error";
  } finally {
    savingDisplay.value = false;
  }
}

async function saveTelegram() {
  savingTelegram.value = true;
  message.value = "";
  try {
    const res = await saveTelegramSettings({
      botToken: telegramBotToken.value,
      chatId: telegramChatId.value,
      notifyEnabled: telegramNotifyEnabled.value,
    });
    showToast(res.message || "保存成功", "success");
  } catch (e: any) {
    message.value = e.message || "保存失败";
    messageType.value = "error";
  } finally {
    savingTelegram.value = false;
  }
}

async function testTelegram() {
  if (!telegramBotToken.value || !telegramChatId.value) {
    showToast("请先填写 Bot Token 和 Chat ID 并保存", "error");
    return;
  }
  testingTelegram.value = true;
  try {
    await saveTelegramSettings({
      botToken: telegramBotToken.value,
      chatId: telegramChatId.value,
      notifyEnabled: telegramNotifyEnabled.value,
    });
    const res = await sendTelegramTestMessage();
    showToast(res.message || "测试消息已发送", "success");
  } catch (e: any) {
    showToast(e.message || "发送失败", "error");
  } finally {
    testingTelegram.value = false;
  }
}

async function doSetupWebhook() {
  if (!telegramBotToken.value) {
    showToast("请先填写 Bot Token 并保存", "error");
    return;
  }
  settingUpWebhook.value = true;
  try {
    // First save settings to ensure backend has latest token
    await saveTelegramSettings({
      botToken: telegramBotToken.value,
      chatId: telegramChatId.value,
      notifyEnabled: telegramNotifyEnabled.value,
    });

    const res = await setupTelegramWebhook();
    showToast(res.message || "Webhook 设置成功", "success");
  } catch (e: any) {
    showToast(e.message || "设置失败", "error");
  } finally {
    settingUpWebhook.value = false;
  }
}

onMounted(() => {
  load();
});
</script>

<style scoped lang="less">
@import "../../styles/components/setting.less";
</style>
