import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { updateSMTPSettings, getSMTPConfig } from '@/lib/settings'
import { testSMTPConnection } from '@/lib/email'

// GET /api/settings/smtp - Get SMTP settings
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

    const config = await getSMTPConfig()

    // Hide password
    return NextResponse.json({
      success: true,
      data: {
        ...config,
        pass: config.pass ? '******' : ''
      }
    })
  } catch (error) {
    console.error('Get SMTP settings error:', error)
    return NextResponse.json(
      { success: false, message: '获取SMTP设置失败' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/smtp - Update SMTP settings
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
    const { host, port, user: smtpUser, pass, from, secure, testOnly } = body

    // If testOnly, just test the connection without saving
    if (testOnly) {
      const currentConfig = await getSMTPConfig()
      const testConfig = {
        host: host || currentConfig.host,
        port: port || currentConfig.port,
        user: smtpUser || currentConfig.user,
        pass: pass === '******' ? currentConfig.pass : (pass || currentConfig.pass),
        secure: secure ?? currentConfig.secure
      }
      
      const result = await testSMTPConnection(testConfig)
      return NextResponse.json(result)
    }

    // Get current config to preserve password if not changed
    const currentConfig = await getSMTPConfig()
    const actualPass = pass === '******' ? currentConfig.pass : pass

    // Save SMTP settings
    await updateSMTPSettings({
      host,
      port: parseInt(port) || 465,
      user: smtpUser,
      pass: actualPass,
      from,
      secure: secure ?? true
    })

    return NextResponse.json({
      success: true,
      message: 'SMTP设置已保存'
    })
  } catch (error) {
    console.error('Update SMTP settings error:', error)
    return NextResponse.json(
      { success: false, message: '更新SMTP设置失败' },
      { status: 500 }
    )
  }
}
