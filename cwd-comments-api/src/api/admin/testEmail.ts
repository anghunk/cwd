import { Context } from 'hono';
import { Bindings } from '../../bindings';
import { sendTestEmail, EmailNotificationSettings, isValidEmail } from '../../utils/email';

export const testEmail = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const body = await c.req.json();
    const toEmail = body.toEmail;
    
    if (!toEmail || !isValidEmail(toEmail)) {
        return c.json({ message: '请输入有效的接收邮箱' }, 400);
    }

    const smtp: EmailNotificationSettings['smtp'] = body.smtp;
    
    if (!smtp || !smtp.user || !smtp.pass) {
        return c.json({ message: 'SMTP 配置不完整' }, 400);
    }

    const result = await sendTestEmail(c.env, toEmail, smtp);
    
    if (result.success) {
        return c.json({ message: '邮件发送成功' });
    } else {
        return c.json({ message: '邮件发送失败: ' + result.message }, 500);
    }

  } catch (e: any) {
    return c.json({ message: e.message || '测试失败' }, 500);
  }
};
