import { db } from './db'

// Default system settings
const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  server_port: { value: '3000', description: '服务监听端口' },
  smtp_host: { value: '', description: 'SMTP服务器地址' },
  smtp_port: { value: '465', description: 'SMTP端口' },
  smtp_user: { value: '', description: 'SMTP用户名' },
  smtp_pass: { value: '', description: 'SMTP密码(加密)' },
  smtp_from: { value: '', description: '发件人邮箱' },
  smtp_secure: { value: 'true', description: '是否使用SSL' },
  reminder_time: { value: '08:00', description: '每日提醒时间' },
  reminder_enabled: { value: 'true', description: '是否启用提醒' },
  advance_days_default: { value: '0', description: '默认提前提醒天数' },
  admin_email: { value: 'admin@birthdays.local', description: '管理员邮箱' },
  system_initialized: { value: 'false', description: '系统是否已初始化' }
}

// Get a setting value
export async function getSetting(key: string): Promise<string | null> {
  const setting = await db.setting.findUnique({
    where: { key }
  })
  return setting?.value ?? DEFAULT_SETTINGS[key]?.value ?? null
}

// Set a setting value
export async function setSetting(key: string, value: string, description?: string): Promise<void> {
  await db.setting.upsert({
    where: { key },
    update: { 
      value,
      ...(description && { description })
    },
    create: {
      key,
      value,
      description: description ?? DEFAULT_SETTINGS[key]?.description ?? ''
    }
  })
}

// Get all settings as object
export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await db.setting.findMany()
  const result: Record<string, string> = {}
  
  // Start with defaults
  for (const [key, data] of Object.entries(DEFAULT_SETTINGS)) {
    result[key] = data.value
  }
  
  // Override with database values
  for (const setting of settings) {
    result[setting.key] = setting.value
  }
  
  return result
}

// Get SMTP configuration
export async function getSMTPConfig() {
  const settings = await getAllSettings()
  return {
    host: settings.smtp_host,
    port: parseInt(settings.smtp_port) || 465,
    user: settings.smtp_user,
    pass: settings.smtp_pass,
    from: settings.smtp_from || settings.smtp_user,
    secure: settings.smtp_secure === 'true'
  }
}

// Get reminder configuration
export async function getReminderConfig() {
  const settings = await getAllSettings()
  return {
    time: settings.reminder_time,
    enabled: settings.reminder_enabled === 'true',
    advanceDaysDefault: parseInt(settings.advance_days_default) || 0
  }
}

// Initialize default settings
export async function initializeSettings(): Promise<void> {
  for (const [key, data] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await db.setting.findUnique({
      where: { key }
    })
    
    if (!existing) {
      await db.setting.create({
        data: {
          key,
          value: data.value,
          description: data.description
        }
      })
    }
  }
  
  // Mark system as initialized
  await setSetting('system_initialized', 'true')
}

// Update SMTP settings
export async function updateSMTPSettings(config: {
  host: string
  port: number
  user: string
  pass: string
  from?: string
  secure?: boolean
}): Promise<void> {
  await setSetting('smtp_host', config.host)
  await setSetting('smtp_port', config.port.toString())
  await setSetting('smtp_user', config.user)
  await setSetting('smtp_pass', config.pass) // In production, should encrypt
  await setSetting('smtp_from', config.from || config.user)
  await setSetting('smtp_secure', (config.secure ?? true).toString())
}

// Update server port
export async function updateServerPort(port: number): Promise<void> {
  await setSetting('server_port', port.toString())
}

// Get server port
export async function getServerPort(): Promise<number> {
  const port = await getSetting('server_port')
  return parseInt(port || '3000')
}
