import { db } from '@/lib/db'
import { isBirthdayToday } from '@/lib/timezone'
import { sendBirthdayReminder } from '@/lib/email'
import { getReminderConfig, getSMTPConfig } from '@/lib/settings'

let schedulerInterval: NodeJS.Timeout | null = null

// Check birthdays and send reminders
export async function checkBirthdaysAndRemind() {
  try {
    const config = await getReminderConfig()
    
    if (!config.enabled) {
      console.log('[Scheduler] Reminders are disabled')
      return
    }

    // Check SMTP configuration
    const smtpConfig = await getSMTPConfig()
    if (!smtpConfig.host || !smtpConfig.user) {
      console.log('[Scheduler] SMTP not configured, skipping reminders')
      return
    }

    // Get all active birthdays
    const birthdays = await db.birthday.findMany({
      where: { isActive: true }
    })

    console.log(`[Scheduler] Checking ${birthdays.length} birthdays...`)

    for (const bd of birthdays) {
      const { isMatch, daysUntil } = isBirthdayToday(
        bd.birthMonth,
        bd.birthDay,
        bd.calendarType,
        bd.advanceDays
      )

      // Check if should remind today
      if (isMatch && daysUntil <= bd.advanceDays) {
        // Check if already reminded today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (bd.lastRemindedAt) {
          const lastReminded = new Date(bd.lastRemindedAt)
          lastReminded.setHours(0, 0, 0, 0)
          
          if (lastReminded.getTime() === today.getTime()) {
            console.log(`[Scheduler] Already reminded for ${bd.name}, skipping`)
            continue
          }
        }

        console.log(`[Scheduler] Sending reminder for ${bd.name} (${daysUntil} days until birthday)`)
        
        const result = await sendBirthdayReminder(bd, daysUntil)
        
        if (result.success) {
          console.log(`[Scheduler] ✓ Reminder sent for ${bd.name}`)
        } else {
          console.error(`[Scheduler] ✗ Failed to send reminder for ${bd.name}: ${result.message}`)
        }
      }
    }

    console.log('[Scheduler] Birthday check completed')
  } catch (error) {
    console.error('[Scheduler] Error checking birthdays:', error)
  }
}

// Start the scheduler
export function startScheduler() {
  if (schedulerInterval) {
    console.log('[Scheduler] Already running')
    return
  }

  // Run every hour
  schedulerInterval = setInterval(async () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()

    // Run at configured reminder time (default 8:00 AM Beijing time)
    if (hours === 8 && minutes === 0) {
      console.log('[Scheduler] Running scheduled birthday check...')
      await checkBirthdaysAndRemind()
    }
  }, 60000) // Check every minute

  console.log('[Scheduler] Birthday reminder scheduler started')
  
  // Also run immediately on start (for testing)
  // checkBirthdaysAndRemind()
}

// Stop the scheduler
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log('[Scheduler] Stopped')
  }
}

// Get scheduler status
export function getSchedulerStatus() {
  return {
    running: schedulerInterval !== null
  }
}
