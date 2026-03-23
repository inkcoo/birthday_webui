import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth'
import { initializeSettings, getSetting, setSetting } from '@/lib/settings'

// GET /api/auth/init - Check initialization status
export async function GET() {
  try {
    const initialized = await getSetting('system_initialized')
    const adminExists = await db.user.findFirst({
      where: { role: 'admin' }
    })

    return NextResponse.json({
      success: true,
      data: {
        initialized: initialized === 'true' || !!adminExists,
        adminExists: !!adminExists
      }
    })
  } catch (error) {
    console.error('Check init status error:', error)
    return NextResponse.json(
      { success: false, message: '检查初始化状态失败' },
      { status: 500 }
    )
  }
}

// POST /api/auth/init - Initialize system
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Check if already initialized
    const adminExists = await db.user.findFirst({
      where: { role: 'admin' }
    })

    if (adminExists) {
      return NextResponse.json(
        { success: false, message: '系统已初始化' },
        { status: 400 }
      )
    }

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: '请填写完整信息' },
        { status: 400 }
      )
    }

    const validation = validatePasswordStrength(password)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      )
    }

    // Create admin user
    const hashedPassword = await hashPassword(password)
    await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'Administrator',
        role: 'admin'
      }
    })

    // Initialize settings
    await initializeSettings()
    await setSetting('admin_email', email)

    return NextResponse.json({
      success: true,
      message: '系统初始化成功'
    })
  } catch (error) {
    console.error('Initialize system error:', error)
    return NextResponse.json(
      { success: false, message: '系统初始化失败' },
      { status: 500 }
    )
  }
}
