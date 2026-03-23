import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { isBirthdayToday } from '@/lib/timezone'

// GET /api/birthdays/upcoming - Get upcoming birthdays
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '登录已过期' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const birthdays = await db.birthday.findMany({
      where: { isActive: true }
    })

    // Calculate upcoming birthdays
    const upcomingBirthdays = birthdays
      .map(bd => {
        const { daysUntil } = isBirthdayToday(bd.birthMonth, bd.birthDay, bd.calendarType, bd.advanceDays)
        return {
          ...bd,
          daysUntil
        }
      })
      .filter(bd => bd.daysUntil >= 0 && bd.daysUntil <= days)
      .sort((a, b) => a.daysUntil - b.daysUntil)

    return NextResponse.json({
      success: true,
      data: upcomingBirthdays
    })
  } catch (error) {
    console.error('Get upcoming birthdays error:', error)
    return NextResponse.json(
      { success: false, message: '获取即将到来的生日失败' },
      { status: 500 }
    )
  }
}
