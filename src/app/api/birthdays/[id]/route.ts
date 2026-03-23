import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { getNextBirthday, formatBirthday, calculateAge } from '@/lib/timezone'

// GET /api/birthdays/[id] - Get single birthday
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const birthday = await db.birthday.findUnique({
      where: { id }
    })

    if (!birthday) {
      return NextResponse.json(
        { success: false, message: '记录不存在' },
        { status: 404 }
      )
    }

    const nextBirthday = getNextBirthday(birthday.birthYear, birthday.birthMonth, birthday.birthDay, birthday.calendarType)
    const age = birthday.birthYear ? calculateAge(birthday.birthYear) : null

    return NextResponse.json({
      success: true,
      data: {
        ...birthday,
        nextBirthday: nextBirthday.toISOString(),
        nextBirthdayFormatted: formatBirthday(birthday.birthMonth, birthday.birthDay, birthday.calendarType, birthday.birthYear || undefined),
        age,
        daysUntil: Math.ceil((nextBirthday.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }
    })
  } catch (error) {
    console.error('Get birthday error:', error)
    return NextResponse.json(
      { success: false, message: '获取生日记录失败' },
      { status: 500 }
    )
  }
}

// PUT /api/birthdays/[id] - Update birthday
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      birthYear, 
      birthMonth, 
      birthDay, 
      calendarType,
      department,
      email,
      phone,
      notes,
      advanceDays,
      isActive
    } = body

    // Check if exists
    const existing = await db.birthday.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: '记录不存在' },
        { status: 404 }
      )
    }

    // Update
    const birthday = await db.birthday.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(birthYear !== undefined && { birthYear: birthYear || null }),
        ...(birthMonth !== undefined && { birthMonth }),
        ...(birthDay !== undefined && { birthDay }),
        ...(calendarType !== undefined && { calendarType }),
        ...(department !== undefined && { department: department || null }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(advanceDays !== undefined && { advanceDays }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({
      success: true,
      message: '更新成功',
      data: birthday
    })
  } catch (error) {
    console.error('Update birthday error:', error)
    return NextResponse.json(
      { success: false, message: '更新生日记录失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/birthdays/[id] - Delete birthday
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Check if exists
    const existing = await db.birthday.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: '记录不存在' },
        { status: 404 }
      )
    }

    // Soft delete
    await db.birthday.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete birthday error:', error)
    return NextResponse.json(
      { success: false, message: '删除生日记录失败' },
      { status: 500 }
    )
  }
}
