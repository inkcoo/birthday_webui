'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { toast } from 'sonner'

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [step, setStep] = useState(1) // 1: 输入邮箱, 2: 输入验证码, 3: 设置新密码
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSendCode = async () => {
    if (!formData.email) {
      toast.error('请输入邮箱')
      return
    }

    setLoading(true)
    try {
      const result = await authApi.forgotPassword(formData.email)
      if (result.success) {
        toast.success('验证码已发送到您的邮箱')
        setStep(2)
        // Start countdown
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(result.message || '发送失败')
      }
    } catch (error) {
      toast.error('发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!formData.code || !formData.newPassword) {
      toast.error('请填写完整信息')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('两次密码输入不一致')
      return
    }

    if (formData.newPassword.length < 8) {
      toast.error('密码长度至少8位')
      return
    }

    setLoading(true)
    try {
      const result = await authApi.resetPassword(formData.email, formData.code, formData.newPassword)
      if (result.success) {
        toast.success('密码重置成功！')
        onOpenChange(false)
        // Reset form
        setStep(1)
        setFormData({ email: '', code: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(result.message || '重置失败')
      }
    } catch (error) {
      toast.error('密码重置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state
    setTimeout(() => {
      setStep(1)
      setFormData({ email: '', code: '', newPassword: '', confirmPassword: '' })
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>找回密码</DialogTitle>
          <DialogDescription>
            {step === 1 && '请输入注册时使用的邮箱，我们将发送验证码'}
            {step === 2 && '请输入收到的6位验证码'}
            {step === 3 && '请设置新密码'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reset-email">邮箱</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <Button
                onClick={handleSendCode}
                className="w-full"
                disabled={loading}
              >
                {loading ? '发送中...' : '发送验证码'}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reset-code">验证码</Label>
                <Input
                  id="reset-code"
                  type="text"
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  返回
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1"
                  disabled={formData.code.length !== 6}
                >
                  下一步
                </Button>
              </div>
              <Button
                variant="link"
                className="w-full"
                onClick={handleSendCode}
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? `${countdown}秒后可重新发送` : '重新发送验证码'}
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="至少8位，包含大小写字母和数字"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="再次输入新密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  返回
                </Button>
                <Button
                  onClick={handleResetPassword}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? '重置中...' : '确认重置'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
