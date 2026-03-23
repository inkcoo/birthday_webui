import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVerificationCode } from '@/lib/email'

// POST /api/auth/forgot-password - Request verification code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: '请输入邮箱地址' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: '该邮箱未注册' },
        { status: 400 }
      )
    }

    // Generate 6-digit code
    const code = Math.random().toString().slice(-6)

    // Delete old codes for this email
    await db.verificationCode.deleteMany({
      where: { email, type: 'password_reset' }
    })

    // Create new verification code (15 minutes expiry)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await db.verificationCode.create({
      data: {
        email,
        code,
        type: 'password_reset',
        expiresAt,
        userId: user.id
      }
    })

    // Send verification email
    const result = await sendVerificationCode(email, code)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '验证码已发送到您的邮箱'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, message: '发送验证码失败' },
      { status: 500 }
    )
  }
}
