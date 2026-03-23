import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { getNextBirthday, formatBirthday, calculateAge } from '@/lib/timezone'

// GET /api/birthdays - List all birthdays
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
    const search = searchParams.get('search') || ''
    const department = searchParams.get('department') || ''
    const calendarType = searchParams.get('calendarType') || ''

    // Build filter
    const where: any = { isActive: true }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { department: { contains: search } },
        { notes: { contains: search } }
      ]
    }
    
    if (department) {
      where.department = department
    }
    
    if (calendarType) {
      where.calendarType = calendarType
    }

    const birthdays = await db.birthday.findMany({
      where,
      orderBy: [
        { birthMonth: 'asc' },
        { birthDay: 'asc' }
      ]
    })

    // Add computed fields
    const enrichedBirthdays = birthdays.map(bd => {
      const nextBirthday = getNextBirthday(bd.birthYear, bd.birthMonth, bd.birthDay, bd.calendarType)
      const age = bd.birthYear ? calculateAge(bd.birthYear) : null
      
      return {
        ...bd,
        nextBirthday: nextBirthday.toISOString(),
        nextBirthdayFormatted: formatBirthday(bd.birthMonth, bd.birthDay, bd.calendarType, bd.birthYear || undefined),
        age,
        daysUntil: Math.ceil((nextBirthday.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedBirthdays
    })
  } catch (error) {
    console.error('Get birthdays error:', error)
    return NextResponse.json(
      { success: false, message: '获取生日列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/birthdays - Create new birthday
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      name, 
      birthYear, 
      birthMonth, 
      birthDay, 
      calendarType = 'solar',
      department,
      email,
      phone,
      notes,
      advanceDays = 0
    } = body

    // Validation
    if (!name || !birthMonth || !birthDay) {
      return NextResponse.json(
        { success: false, message: '姓名、月份和日期为必填项' },
        { status: 400 }
      )
    }

    if (birthMonth < 1 || birthMonth > 12) {
      return NextResponse.json(
        { success: false, message: '月份必须在1-12之间' },
        { status: 400 }
      )
    }

    if (birthDay < 1 || birthDay > 31) {
      return NextResponse.json(
        { success: false, message: '日期必须在1-31之间' },
        { status: 400 }
      )
    }

    const birthday = await db.birthday.create({
      data: {
        name,
        birthYear: birthYear || null,
        birthMonth,
        birthDay,
        calendarType,
        department: department || null,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
        advanceDays
      }
    })

    return NextResponse.json({
      success: true,
      message: '添加成功',
      data: birthday
    })
  } catch (error) {
    console.error('Create birthday error:', error)
    return NextResponse.json(
      { success: false, message: '添加生日记录失败' },
      { status: 500 }
    )
  }
}
