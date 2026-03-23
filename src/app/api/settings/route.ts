import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getAllSettings, getSetting, setSetting } from '@/lib/settings'

// GET /api/settings - Get all settings
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

    const settings = await getAllSettings()

    // Hide sensitive data
    const safeSettings = { ...settings }
    if (safeSettings.smtp_pass) {
      safeSettings.smtp_pass = '******' // Don't expose password
    }

    return NextResponse.json({
      success: true,
      data: safeSettings
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { success: false, message: '获取设置失败' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
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
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, message: '无效的设置数据' },
        { status: 400 }
      )
    }

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      // Skip password if it's masked
      if (key === 'smtp_pass' && value === '******') {
        continue
      }
      
      if (typeof value === 'string') {
        await setSetting(key, value)
      }
    }

    return NextResponse.json({
      success: true,
      message: '设置已更新'
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { success: false, message: '更新设置失败' },
      { status: 500 }
    )
  }
}
