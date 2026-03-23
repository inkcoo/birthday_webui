import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getSetting, setSetting } from '@/lib/settings'

// GET /api/settings/port - Get current port
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

    const port = await getSetting('server_port')

    return NextResponse.json({
      success: true,
      data: { port: parseInt(port || '3000') }
    })
  } catch (error) {
    console.error('Get port error:', error)
    return NextResponse.json(
      { success: false, message: '获取端口失败' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/port - Update port
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
    const { port } = body

    if (!port || port < 1 || port > 65535) {
      return NextResponse.json(
        { success: false, message: '端口号必须在1-65535之间' },
        { status: 400 }
      )
    }

    await setSetting('server_port', port.toString())

    return NextResponse.json({
      success: true,
      message: `端口已修改为 ${port}，重启服务后生效`,
      data: { port }
    })
  } catch (error) {
    console.error('Update port error:', error)
    return NextResponse.json(
      { success: false, message: '更新端口失败' },
      { status: 500 }
    )
  }
}
