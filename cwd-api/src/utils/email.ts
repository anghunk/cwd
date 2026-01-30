import { Bindings } from '../bindings';
import { createTransport } from 'nodemailer';

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const EMAIL_NOTIFY_GLOBAL_KEY = 'email_notify_enabled';
const SMTP_HOST_KEY = 'email_smtp_host';
const SMTP_PORT_KEY = 'email_smtp_port';
const SMTP_USER_KEY = 'email_smtp_user';
const SMTP_PASS_KEY = 'email_smtp_pass';
const SMTP_SECURE_KEY = 'email_smtp_secure';
const EMAIL_TEMPLATE_REPLY_KEY = 'email_template_reply';
const EMAIL_TEMPLATE_ADMIN_KEY = 'email_template_admin';

type MailGatewayPayload = {
  to: string[];
  subject: string;
  html: string;
};

export type EmailNotificationSettings = {
  globalEnabled: boolean;
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };
  templates?: {
    reply?: string;
    admin?: string;
  };
};

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

function replaceTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => variables[key] || '');
}

async function dispatchMail(
  env: Bindings,
  payload: MailGatewayPayload,
  smtpSettings?: EmailNotificationSettings['smtp']
) {
  // 1. Try SMTP
  if (smtpSettings && smtpSettings.user && smtpSettings.pass) {
    try {
      console.log('MailDispatch:SMTP:start', { host: smtpSettings.host, user: smtpSettings.user });
      const transporter = createTransport({
        host: smtpSettings.host || 'smtp.qq.com',
        port: smtpSettings.port || 465,
        secure: smtpSettings.secure ?? true,
        auth: {
          user: smtpSettings.user,
          pass: smtpSettings.pass,
        },
      });

      await transporter.sendMail({
        from: `"评论通知" <${smtpSettings.user}>`,
        to: payload.to.join(', '),
        subject: payload.subject,
        html: payload.html,
      });

      console.log('MailDispatch:SMTP:success', { to: payload.to });
      return;
    } catch (e: any) {
      console.error('MailDispatch:SMTP:error', {
        message: e?.message || String(e),
      });
      // Fallback to gateway?
    }
  }

  if (!env.MAIL_GATEWAY_URL) {
    if (!smtpSettings?.user) {
        console.error('MailGateway:missingUrlAndSmtp');
    }
    return;
  }

  try {
    const res = await fetch(env.MAIL_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.MAIL_GATEWAY_TOKEN ? { 'X-Auth-Token': env.MAIL_GATEWAY_TOKEN } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error('MailGateway:sendFailed', {
        status: res.status,
        statusText: res.statusText
      });
    }
  } catch (e: any) {
    console.error('MailGateway:error', {
      message: e?.message || String(e)
    });
  }
}

export async function sendTestEmail(
    env: Bindings,
    to: string,
    smtp: EmailNotificationSettings['smtp']
): Promise<{ success: boolean; message?: string }> {
    if (!smtp || !smtp.user || !smtp.pass) {
        return { success: false, message: 'SMTP 配置不完整' };
    }
    
    try {
        const transporter = createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: { user: smtp.user, pass: smtp.pass }
        });
        
        // 尝试验证连接配置
        await transporter.verify();
        
        await transporter.sendMail({
            from: `"Test" <${smtp.user}>`,
            to: to,
            subject: 'CWD Comments 邮件配置测试',
            html: `
            <div style="padding: 20px; font-family: sans-serif;">
              <h2 style="color: #059669;">配置成功！</h2>
              <p>这就是一封来自 CWD Comments 的测试邮件。</p>
              <p>如果您收到了这封邮件，说明您的 SMTP 配置是正确的。</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">发送时间：${new Date().toLocaleString()}</p>
            </div>
            `
        });
        return { success: true };
    } catch (e: any) {
        console.error('TestEmail:error', e);
        return { success: false, message: e.message || String(e) };
    }
}

function parseEnabled(raw: string | undefined, defaultValue: boolean) {
  if (raw === undefined) return defaultValue;
  return raw === '1';
}

export async function loadEmailNotificationSettings(
  env: Bindings
): Promise<EmailNotificationSettings> {
  await env.CWD_DB.prepare(
    'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  ).run();

  const keys = [
    EMAIL_NOTIFY_GLOBAL_KEY,
    SMTP_HOST_KEY,
    SMTP_PORT_KEY,
    SMTP_USER_KEY,
    SMTP_PASS_KEY,
    SMTP_SECURE_KEY,
    EMAIL_TEMPLATE_REPLY_KEY,
    EMAIL_TEMPLATE_ADMIN_KEY
  ];

  const { results } = await env.CWD_DB.prepare(
    `SELECT key, value FROM Settings WHERE key IN (${keys.map(() => '?').join(',')})`
  )
    .bind(...keys)
    .all<{ key: string; value: string }>();

  const map = new Map<string, string>();
  for (const row of results) {
    if (row && row.key) {
      map.set(row.key, row.value);
    }
  }

  const globalEnabled = parseEnabled(map.get(EMAIL_NOTIFY_GLOBAL_KEY), true);
  
  const smtp: EmailNotificationSettings['smtp'] = {
      host: map.get(SMTP_HOST_KEY) || 'smtp.qq.com',
      port: parseInt(map.get(SMTP_PORT_KEY) || '465', 10),
      user: map.get(SMTP_USER_KEY) || '',
      pass: map.get(SMTP_PASS_KEY) || '',
      secure: map.get(SMTP_SECURE_KEY) !== '0'
  };

  const templates = {
    reply: map.get(EMAIL_TEMPLATE_REPLY_KEY) || DEFAULT_REPLY_TEMPLATE,
    admin: map.get(EMAIL_TEMPLATE_ADMIN_KEY) || DEFAULT_ADMIN_TEMPLATE
  };

  return {
    globalEnabled,
    smtp,
    templates
  };
}

export async function saveEmailNotificationSettings(
  env: Bindings,
  settings: {
    globalEnabled?: boolean;
    smtp?: Partial<EmailNotificationSettings['smtp']>;
    templates?: Partial<NonNullable<EmailNotificationSettings['templates']>>;
  }
) {
  await env.CWD_DB.prepare(
    'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  ).run();

  const entries: { key: string; value: string | undefined }[] = [];

  if (settings.globalEnabled !== undefined) {
      entries.push({ key: EMAIL_NOTIFY_GLOBAL_KEY, value: settings.globalEnabled ? '1' : '0' });
  }
  if (settings.smtp) {
      if (settings.smtp.host !== undefined) entries.push({ key: SMTP_HOST_KEY, value: settings.smtp.host });
      if (settings.smtp.port !== undefined) entries.push({ key: SMTP_PORT_KEY, value: String(settings.smtp.port) });
      if (settings.smtp.user !== undefined) entries.push({ key: SMTP_USER_KEY, value: settings.smtp.user });
      if (settings.smtp.pass !== undefined) entries.push({ key: SMTP_PASS_KEY, value: settings.smtp.pass });
      if (settings.smtp.secure !== undefined) entries.push({ key: SMTP_SECURE_KEY, value: settings.smtp.secure ? '1' : '0' });
  }

  if (settings.templates) {
      if (settings.templates.reply !== undefined) entries.push({ key: EMAIL_TEMPLATE_REPLY_KEY, value: settings.templates.reply });
      if (settings.templates.admin !== undefined) entries.push({ key: EMAIL_TEMPLATE_ADMIN_KEY, value: settings.templates.admin });
  }

  for (const entry of entries) {
      if (entry.value !== undefined) {
          await env.CWD_DB.prepare('REPLACE INTO Settings (key, value) VALUES (?, ?)')
            .bind(entry.key, entry.value)
            .run();
      }
  }
}

export async function sendCommentReplyNotification(
  env: Bindings,
  params: {
    toEmail: string;
    toName: string;
    postTitle: string;
    parentComment: string;
    replyAuthor: string;
    replyContent: string;
    postUrl: string;
  },
  smtpSettings?: EmailNotificationSettings['smtp'],
  template?: string
) {
  const { toEmail, toName, postTitle, parentComment, replyAuthor, replyContent, postUrl } = params;

  console.log('EmailReplyNotification:start', {
    toEmail,
    toName,
    postTitle
  });

  const html = replaceTemplate(template || DEFAULT_REPLY_TEMPLATE, {
    toEmail,
    toName,
    postTitle,
    parentComment,
    replyAuthor,
    replyContent,
    postUrl
  });

  if (!isValidEmail(toEmail)) {
    console.warn('EmailReplyNotification:invalidRecipient', { toEmail });
    return;
  }

  await dispatchMail(env, {
    to: [toEmail],
    subject: `评论回复 - ${postTitle}`,
    html
  }, smtpSettings);

  console.log('EmailReplyNotification:sent', {
    toEmail
  });
}

/**
 * 站长通知邮件
 */
export async function sendCommentNotification(
  env: Bindings,
  params: {
    postTitle: string;
    postUrl: string;
    commentAuthor: string;
    commentContent: string;
  },
  smtpSettings?: EmailNotificationSettings['smtp'],
  template?: string
) {
  const { postTitle, postUrl, commentAuthor, commentContent } = params;
  const toEmail = await getAdminNotifyEmail(env);

  const html = replaceTemplate(template || DEFAULT_ADMIN_TEMPLATE, {
    postTitle,
    postUrl,
    commentAuthor,
    commentContent
  });

  if (!isValidEmail(toEmail)) {
    console.warn('EmailAdminNotification:invalidRecipient', { toEmail });
    return;
  }

  await dispatchMail(env, {
    to: [toEmail],
    subject: `新评论提醒 - ${postTitle}`,
    html
  }, smtpSettings);

  console.log('EmailAdminNotification:sent', {
    toEmail
  });
}

export async function getAdminNotifyEmail(env: Bindings): Promise<string> {
  await env.CWD_DB.prepare(
    'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  ).run();
  const rows = await env.CWD_DB.prepare(
    'SELECT key, value FROM Settings WHERE key IN (?, ?)'
  )
    .bind('comment_admin_email', 'admin_notify_email')
    .all<{ key: string; value: string }>();

  let email: string | null = null;
  if (rows && Array.isArray(rows.results)) {
    const commentEmailRow = rows.results.find((row) => row.key === 'comment_admin_email');
    const legacyEmailRow = rows.results.find((row) => row.key === 'admin_notify_email');
    email = commentEmailRow?.value || legacyEmailRow?.value || null;
  }

  if (email && isValidEmail(email)) {
    return email.trim();
  }

  throw new Error('未配置管理员通知邮箱或格式不正确');
}
