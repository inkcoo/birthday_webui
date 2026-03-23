import { Lunar, Solar } from 'lunar-javascript'

// Beijing timezone
export const BEIJING_TIMEZONE = 'Asia/Shanghai'

// Get current Beijing time
export function getBeijingTime(): Date {
  const now = new Date()
  const beijingTime = new Date(now.toLocaleString('en-US', { timeZone: BEIJING_TIMEZONE }))
  return beijingTime
}

// Format date for display (Beijing time)
export function formatBeijingTime(date: Date, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: BEIJING_TIMEZONE
  }
  
  switch (format) {
    case 'date':
      options.year = 'numeric'
      options.month = '2-digit'
      options.day = '2-digit'
      break
    case 'time':
      options.hour = '2-digit'
      options.minute = '2-digit'
      options.second = '2-digit'
      break
    case 'datetime':
    default:
      options.year = 'numeric'
      options.month = '2-digit'
      options.day = '2-digit'
      options.hour = '2-digit'
      options.minute = '2-digit'
      break
  }
  
  return date.toLocaleString('zh-CN', options)
}

// Convert solar date to lunar date
export function solarToLunar(year: number, month: number, day: number): { year: number; month: number; day: number; isLeap: boolean } {
  try {
    const solar = Solar.fromYmd(year, month, day)
    const lunar = solar.getLunar()
    return {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay(),
      isLeap: lunar.getMonth() < 0 // Negative month means leap month
    }
  } catch {
    return { year, month, day, isLeap: false }
  }
}

// Convert lunar date to solar date
export function lunarToSolar(year: number, month: number, day: number, isLeap: boolean = false): { year: number; month: number; day: number } {
  try {
    const lunar = Lunar.fromYmd(year, isLeap ? -month : month, day)
    const solar = lunar.getSolar()
    return {
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay()
    }
  } catch {
    return { year, month, day }
  }
}

// Check if today matches a birthday (considering calendar type)
export function isBirthdayToday(birthMonth: number, birthDay: number, calendarType: string, advanceDays: number = 0): { isMatch: boolean; daysUntil: number } {
  const today = getBeijingTime()
  const currentYear = today.getFullYear()
  
  let targetMonth = birthMonth
  let targetDay = birthDay
  
  // If lunar calendar, convert to solar for this year
  if (calendarType === 'lunar') {
    const solarDate = lunarToSolar(currentYear, birthMonth, birthDay, false)
    targetMonth = solarDate.month
    targetDay = solarDate.day
  }
  
  // Create target date for this year
  const targetDate = new Date(currentYear, targetMonth - 1, targetDay)
  
  // If the date has passed this year, check next year
  if (targetDate < today) {
    const nextYear = currentYear + 1
    if (calendarType === 'lunar') {
      const solarDate = lunarToSolar(nextYear, birthMonth, birthDay, false)
      targetMonth = solarDate.month
      targetDay = solarDate.day
    }
    const nextTargetDate = new Date(nextYear, targetMonth - 1, targetDay)
    const diffTime = nextTargetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return { isMatch: diffDays <= advanceDays, daysUntil: diffDays }
  }
  
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return { isMatch: diffDays <= advanceDays && diffDays >= 0, daysUntil: diffDays }
}

// Get next birthday date
export function getNextBirthday(birthYear: number | null, birthMonth: number, birthDay: number, calendarType: string): Date {
  const today = getBeijingTime()
  const currentYear = today.getFullYear()
  
  let targetMonth = birthMonth
  let targetDay = birthDay
  
  // If lunar calendar, convert to solar for this year
  if (calendarType === 'lunar') {
    const solarDate = lunarToSolar(currentYear, birthMonth, birthDay, false)
    targetMonth = solarDate.month
    targetDay = solarDate.day
  }
  
  // Create target date for this year
  let targetDate = new Date(currentYear, targetMonth - 1, targetDay)
  
  // If the date has passed this year, use next year
  if (targetDate < today) {
    const nextYear = currentYear + 1
    if (calendarType === 'lunar') {
      const solarDate = lunarToSolar(nextYear, birthMonth, birthDay, false)
      targetMonth = solarDate.month
      targetDay = solarDate.day
    }
    targetDate = new Date(nextYear, targetMonth - 1, targetDay)
  }
  
  return targetDate
}

// Calculate age
export function calculateAge(birthYear: number): number {
  const today = getBeijingTime()
  return today.getFullYear() - birthYear
}

// Format birthday display
export function formatBirthday(month: number, day: number, calendarType: string, year?: number): string {
  const calendar = calendarType === 'lunar' ? '农历' : '公历'
  const dateStr = year ? `${year}年${month}月${day}日` : `${month}月${day}日`
  return `${dateStr} (${calendar})`
}
