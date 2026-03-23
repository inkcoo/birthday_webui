import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

// GET /api/birthdays/departments - Get all departments
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

    const departments = await db.birthday.findMany({
      where: { 
        isActive: true,
        department: { not: null }
      },
      select: { department: true },
      distinct: ['department']
    })

    return NextResponse.json({
      success: true,
      data: departments.map(d => d.department).filter(Boolean)
    })
  } catch (error) {
    console.error('Get departments error:', error)
    return NextResponse.json(
      { success: false, message: '获取部门列表失败' },
      { status: 500 }
    )
  }
}
