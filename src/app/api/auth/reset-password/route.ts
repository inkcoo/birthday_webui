import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth'

// POST /api/auth/reset-password - Reset password with verification code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, newPassword } = body

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, message: '请填写完整信息' },
        { status: 400 }
      )
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      )
    }

    // Find verification code
    const verificationCode = await db.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'password_reset',
        expiresAt: { gt: new Date() },
        usedAt: null
      }
    })

    if (!verificationCode) {
      return NextResponse.json(
        { success: false, message: '验证码无效或已过期' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 400 }
      )
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword)
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Mark code as used
    await db.verificationCode.update({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() }
    })

    // Delete all other codes for this email
    await db.verificationCode.deleteMany({
      where: { email, type: 'password_reset' }
    })

    return NextResponse.json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { success: false, message: '密码重置失败' },
      { status: 500 }
    )
  }
}
