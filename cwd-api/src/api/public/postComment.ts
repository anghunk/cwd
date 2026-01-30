import { Context } from 'hono';
import { UAParser } from 'ua-parser-js';
import { marked } from 'marked';
import xss from 'xss';
import { Bindings } from '../../bindings';
import {
  sendCommentNotification,
  sendCommentReplyNotification,
  isValidEmail,
  getAdminNotifyEmail,
  loadEmailNotificationSettings,
  EmailNotificationSettings
} from '../../utils/email';
import { loadTelegramSettings, sendTelegramMessage } from '../../utils/telegram';

// 检查内容，将<script>标签之间的内容删除
export function checkContent(content: string): string {
    return content.replace(/<script[\s\S]*?<\/script>/g, "");
}

export const postComment = async (c: Context<{ Bindings: Bindings }>) => {
  const data = await c.req.json();
  if (!data || typeof data !== 'object') {
    return c.json({ message: '无效的请求体' }, 400);
  }
  const { post_slug, content: rawContent, name: rawName, email, url, post_title, post_url, adminToken } = data;
  const parentId = (data as any).parent_id ?? (data as any).parentId ?? null;
  if (!post_slug || typeof post_slug !== 'string') {
    return c.json({ message: 'post_slug 必填' }, 400);
  }
  if (!rawContent || typeof rawContent !== 'string') {
    return c.json({ message: '评论内容不能为空' }, 400);
  }
  if (!rawName || typeof rawName !== 'string') {
    return c.json({ message: '昵称不能为空' }, 400);
  }
  if (!email || typeof email !== 'string') {
    return c.json({ message: '邮箱不能为空' }, 400);
  }
  if (!isValidEmail(email)) {
    return c.json({ message: '邮箱格式不正确' }, 400);
  }
  const ua = c.req.header('user-agent') || "";

  const ip = c.req.header('cf-connecting-ip') || "127.0.0.1";

  const adminEmail = await c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
    .bind('comment_admin_email')
    .first<string>('value');

  const requireReviewRaw = await c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
    .bind('comment_require_review')
    .first<string>('value');
  const requireReview = requireReviewRaw === '1';

  const blockedIpsRow = await c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
    .bind('comment_blocked_ips')
    .first<{ value: string }>();
  const blockedIpsValue = blockedIpsRow?.value || '';
  const blockedIps = blockedIpsValue
    ? blockedIpsValue.split(',').map((d) => d.trim()).filter(Boolean)
    : [];
  if (blockedIps.length && blockedIps.includes(ip)) {
    return c.json({ message: '当前 IP 已被限制评论，请联系站长进行处理' }, 403);
  }

  const blockedEmailsRow = await c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
    .bind('comment_blocked_emails')
    .first<{ value: string }>();
  const blockedEmailsValue = blockedEmailsRow?.value || '';
  const blockedEmails = blockedEmailsValue
    ? blockedEmailsValue.split(',').map((d) => d.trim()).filter(Boolean)
    : [];
  if (blockedEmails.length && blockedEmails.includes(email)) {
    return c.json({ message: '当前邮箱已被限制评论，请联系站长进行处理' }, 403);
  }

  let isAdminComment = false;

  if (adminEmail && email === adminEmail) {
    const adminKey = await c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
      .bind('comment_admin_key_hash')
      .first<string>('value');

    if (adminKey) {
      const lockKey = `admin_lock:${ip}`;
      const isLocked = await c.env.CWD_AUTH_KV.get(lockKey);
      if (isLocked) {
        return c.json({ message: "验证失败次数过多，请 30 分钟后再试" }, 403);
      }

      if (!adminToken) {
        return c.json({ message: "请输入管理员密钥", requireAuth: true }, 401);
      }

      if (adminToken !== adminKey) {
        const failKey = `admin_fail:${ip}`;
        const failsStr = await c.env.CWD_AUTH_KV.get(failKey);
        let fails = failsStr ? parseInt(failsStr) : 0;
        fails++;

        if (fails >= 3) {
          await c.env.CWD_AUTH_KV.put(lockKey, '1', { expirationTtl: 1800 });
          await c.env.CWD_AUTH_KV.delete(failKey);
          return c.json({ message: "验证失败次数过多，请 30 分钟后再试" }, 403);
        } else {
          await c.env.CWD_AUTH_KV.put(failKey, fails.toString(), { expirationTtl: 3600 });
          return c.json({ message: "密钥错误" }, 401);
        }
      }

      await c.env.CWD_AUTH_KV.delete(`admin_fail:${ip}`);
      isAdminComment = true;
    }
  }
  // 2. 检查评论频率控制 (对应 canPostComment)
  // 这里建议使用 D1 查最近一条评论的时间，或者直接放行（如果使用了 Cloudflare WAF）
  const lastComment = await c.env.CWD_DB.prepare(
    'SELECT created FROM Comment WHERE ip_address = ? ORDER BY created DESC LIMIT 1'
  ).bind(ip).first<{ created: number }>();

  if (lastComment) {
    const lastTime = lastComment.created;
    if (Date.now() - lastTime < 10 * 1000) {
      return c.json({ message: "评论频繁，等10s后再试" }, 429);
    }
  }

  // 3. 准备数据
  const cleanedContent = checkContent(rawContent);
  const contentText = cleanedContent;
  const name = checkContent(rawName);

  // Markdown 渲染与 XSS 过滤
  const html = await marked.parse(cleanedContent, { async: true });
  const contentHtml = xss(html, {
    whiteList: {
      ...xss.whiteList,
      code: ['class'],
      span: ['class', 'style'],
      pre: ['class'],
      div: ['class', 'style'],
      img: ['src', 'alt', 'title', 'width', 'height', 'style']
    }
  });

  console.log('PostComment:request', {
    postSlug: post_slug,
    hasParent: parentId !== null && parentId !== undefined,
    name,
    email,
    ip
  });
  const uaParser = new UAParser(ua);
  const uaResult = uaParser.getResult();

  const defaultStatus = requireReview && !isAdminComment ? "pending" : "approved";

  try {
    const result = await c.env.CWD_DB.prepare(`
      INSERT INTO Comment (
        created, post_slug, name, email, url, ip_address, 
        os, browser, device, ua, content_text, content_html, 
        parent_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      Date.now(),
      post_slug,
      name,
      email,
      url || null,
      ip,
      `${uaResult.os.name || ""} ${uaResult.os.version || ""}`.trim(),
      `${uaResult.browser.name || ""} ${uaResult.browser.version || ""}`.trim(),
      uaResult.device.model || uaResult.device.type || "Desktop",
      ua,
      contentText,
      contentHtml,
      parentId || null,
      defaultStatus
    ).run();

    if (!result.success) throw new Error("Database insert failed");
    const commentId = result.meta?.last_row_id;

    console.log('PostComment:inserted', {
      postSlug: post_slug,
      hasParent: parentId !== null && parentId !== undefined,
      ip,
      commentId
    });

    let notifySettings: EmailNotificationSettings = {
      globalEnabled: true
    };
    try {
      notifySettings = await loadEmailNotificationSettings(c.env);
    } catch (e) {
      console.error('PostComment:mailDispatch:loadEmailSettingsFailed', e);
    }

    console.log('PostComment:notify:start', {
      hasParent: parentId !== null && parentId !== undefined,
      emailEnabled: notifySettings.globalEnabled
    });

    c.executionCtx.waitUntil((async () => {
      try {
        if (!notifySettings.globalEnabled) {
          console.log('PostComment:mailDispatch:disabledByGlobalConfig');
        } else {
          console.log('PostComment:mailDispatch:start', {
            hasParent: parentId !== null && parentId !== undefined
          });
          if (parentId !== null && parentId !== undefined) {
            let adminEmail: string | null = null;
            try {
              adminEmail = await getAdminNotifyEmail(c.env);
            } catch (e) {
              console.error('PostComment:mailDispatch:userReply:getAdminEmailFailed', e);
            }
            const isAdminReply = !!adminEmail && email === adminEmail;

            const parentComment = await c.env.CWD_DB.prepare(
              "SELECT name, email, content_html FROM Comment WHERE id = ?"
            ).bind(parentId).first<{ name: string, email: string, content_html: string }>();

            if (parentComment && parentComment.email && parentComment.email !== email) {
              if (isValidEmail(parentComment.email)) {
                console.log('PostComment:mailDispatch:userReply:send', {
                  toEmail: parentComment.email,
                  toName: parentComment.name
                });
                await sendCommentReplyNotification(c.env, {
                  toEmail: parentComment.email,
                  toName: parentComment.name,
                  postTitle: data.post_title,
                  parentComment: parentComment.content_html,
                  replyAuthor: name,
                  replyContent: contentHtml,
                  postUrl: data.post_url,
                }, notifySettings.smtp, notifySettings.templates?.reply);
                console.log('PostComment:mailDispatch:userReply:sent', {
                  toEmail: parentComment.email
                });
              }
            }
          } else {
            console.log('PostComment:mailDispatch:admin:send');
            await sendCommentNotification(c.env, {
              postTitle: data.post_title,
              postUrl: data.post_url,
              commentAuthor: name,
              commentContent: contentHtml
            }, notifySettings.smtp, notifySettings.templates?.admin);
            console.log('PostComment:mailDispatch:admin:sent');
          }
        }
      } catch (mailError) {
        console.error("Mail Notification Failed:", mailError);
      }

      try {
        const tgSettings = await loadTelegramSettings(c.env);
        if (tgSettings.notifyEnabled && tgSettings.botToken && tgSettings.chatId && commentId) {
          const buttons: { text: string; callback_data: string }[] = [];

          if (defaultStatus === 'pending') {
            buttons.push({ text: "批准", callback_data: `approve:${commentId}` });
            buttons.push({ text: "删除", callback_data: `delete:${commentId}` });
          } else {
            buttons.push({ text: "删除", callback_data: `delete:${commentId}` });
          }

          const message = `
💬 *新评论*
文章: [${data.post_title || 'Untitled'}](${data.post_url || '#'})
作者: ${name} (${email})
状态: ${defaultStatus === 'pending' ? '⏳ 待审核' : '✅ 已通过'}

${contentText}

#ID:${commentId}
          `.trim();

          await sendTelegramMessage(tgSettings.botToken, tgSettings.chatId, message, {
            reply_markup: {
              inline_keyboard: [buttons]
            }
          });
        }
      } catch (tgError) {
        console.error('Telegram Notification Failed:', tgError);
      }
    })());

    if (defaultStatus === "pending") {
      return c.json({
        message: '已提交评论，待管理员审核后显示',
        status: defaultStatus
      });
    }

    return c.json({
      message: '评论已提交',
      status: defaultStatus
    });

  } catch (e: any) {
    console.error("Create Comment Error:", e);
    return c.json({ message: "Internal Server Error" }, 500);
  }
};
