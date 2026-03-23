import nodemailer from 'nodemailer'
import { getSMTPConfig } from './settings'
import { db } from './db'

// Create email transporter
async function createTransporter() {
  const config = await getSMTPConfig()
  
  if (!config.host || !config.user) {
    throw new Error('SMTP配置不完整，请先配置邮箱设置')
  }
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  })
}

// Log email sending
async function logEmail(to: string, subject: string, status: string, error?: string, birthdayId?: string, userId?: string) {
  await db.emailLog.create({
    data: {
      to,
      subject,
      status,
      error,
      birthdayId,
      userId
    }
  })
}

// Send birthday reminder email
export async function sendBirthdayReminder(
  birthday: {
    id: string
    name: string
    birthYear: number | null
    birthMonth: number
    birthDay: number
    calendarType: string
    department: string | null
    email: string | null
    notes: string | null
  },
  daysUntil: number,
  userId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = await createTransporter()
    const config = await getSMTPConfig()
    
    const ageText = birthday.birthYear ? ` (${new Date().getFullYear() - birthday.birthYear}岁)` : ''
    const advanceText = daysUntil > 0 ? `${daysUntil}天后` : '今天'
    const calendarText = birthday.calendarType === 'lunar' ? '农历' : '公历'
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .birthday-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .birthday-name { font-size: 24px; font-weight: bold; color: #667eea; }
          .birthday-date { font-size: 16px; color: #666; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎂 生日提醒</h1>
            <p>${advanceText}是特别的日子！</p>
          </div>
          <div class="content">
            <div class="birthday-card">
              <div class="birthday-name">${birthday.name}${ageText}</div>
              <div class="birthday-date">
                📅 ${birthday.birthMonth}月${birthday.birthDay}日 (${calendarText})
                ${birthday.department ? `<br/>🏢 部门: ${birthday.department}` : ''}
              </div>
              ${birthday.notes ? `<div style="margin-top: 15px; color: #888;">📝 备注: ${birthday.notes}</div>` : ''}
            </div>
            <p>请记得送上您的祝福！</p>
          </div>
          <div class="footer">
            <p>此邮件由 Birthdays Reminder Pro 自动发送</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    await transporter.sendMail({
      from: config.from,
      to: config.from, // Send to admin by default
      subject: `🎂 生日提醒: ${birthday.name}${ageText} - ${advanceText}生日`,
      html
    })
    
    // Log success
    await logEmail(config.from, `生日提醒: ${birthday.name}`, 'success', undefined, birthday.id, userId)
    
    // Update last reminded time
    await db.birthday.update({
      where: { id: birthday.id },
      data: { lastRemindedAt: new Date() }
    })
    
    return { success: true, message: '邮件发送成功' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    
    // Log failure
    const config = await getSMTPConfig()
    await logEmail(config.from, `生日提醒: ${birthday.name}`, 'failed', errorMessage, birthday.id, userId)
    
    return { success: false, message: `邮件发送失败: ${errorMessage}` }
  }
}

// Send verification code email
export async function sendVerificationCode(
  email: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = await createTransporter()
    const config = await getSMTPConfig()
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 500px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 密码重置</h1>
            <p>Birthdays Reminder Pro</p>
          </div>
          <div class="content">
            <p>您正在重置密码，验证码为：</p>
            <div class="code">${code}</div>
            <p style="color: #999; font-size: 14px;">验证码15分钟内有效，请勿告诉他人</p>
          </div>
          <div class="footer">
            <p>如非本人操作，请忽略此邮件</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    await transporter.sendMail({
      from: config.from,
      to: email,
      subject: 'Birthdays Reminder - 密码重置验证码',
      html
    })
    
    return { success: true, message: '验证码已发送' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return { success: false, message: `验证码发送失败: ${errorMessage}` }
  }
}

// Test SMTP connection
export async function testSMTPConnection(config?: {
  host: string
  port: number
  user: string
  pass: string
  secure: boolean
}): Promise<{ success: boolean; message: string }> {
  try {
    let smtpConfig = config
    
    if (!smtpConfig) {
      const settings = await getSMTPConfig()
      smtpConfig = settings
    }
    
    if (!smtpConfig.host || !smtpConfig.user) {
      return { success: false, message: 'SMTP配置不完整' }
    }
    
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      }
    })
    
    await transporter.verify()
    return { success: true, message: 'SMTP连接测试成功' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return { success: false, message: `SMTP连接失败: ${errorMessage}` }
  }
}
