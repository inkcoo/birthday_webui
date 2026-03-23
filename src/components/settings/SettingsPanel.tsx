'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { settingsApi, authApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'
import { Settings, Mail, Lock, Server, TestTube, Save, AlertTriangle } from 'lucide-react'

export default function SettingsPanel() {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const { user } = useAuthStore()
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // SMTP form
  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: '465',
    user: '',
    pass: '',
    from: '',
    secure: true
  })

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    reminder_time: '08:00',
    reminder_enabled: true,
    advance_days_default: '0',
    server_port: '3000'
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const [settingsRes, smtpRes] = await Promise.all([
        settingsApi.get(),
        settingsApi.getSMTP()
      ])

      if (settingsRes.success && settingsRes.data) {
        setSystemSettings({
          reminder_time: settingsRes.data.reminder_time || '08:00',
          reminder_enabled: settingsRes.data.reminder_enabled === 'true',
          advance_days_default: settingsRes.data.advance_days_default || '0',
          server_port: settingsRes.data.server_port || '3000'
        })
      }

      if (smtpRes.success && smtpRes.data) {
        setSmtpForm({
          host: smtpRes.data.host || '',
          port: smtpRes.data.port?.toString() || '465',
          user: smtpRes.data.user || '',
          pass: smtpRes.data.pass || '',
          from: smtpRes.data.from || '',
          secure: smtpRes.data.secure ?? true
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error('请填写完整信息')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次密码输入不一致')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('密码长度至少8位')
      return
    }

    setLoading(true)
    try {
      const result = await authApi.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      if (result.success) {
        toast.success('密码修改成功')
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(result.message || '修改失败')
      }
    } catch (error) {
      toast.error('修改密码失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTestSMTP = async () => {
    if (!smtpForm.host || !smtpForm.user) {
      toast.error('请填写SMTP服务器和用户名')
      return
    }

    setTesting(true)
    try {
      const result = await settingsApi.updateSMTP({ ...smtpForm, testOnly: true })
      if (result.success) {
        toast.success('SMTP连接测试成功')
      } else {
        toast.error(result.message || '连接失败')
      }
    } catch (error) {
      toast.error('测试连接失败')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveSMTP = async () => {
    if (!smtpForm.host || !smtpForm.user || !smtpForm.pass) {
      toast.error('请填写SMTP配置')
      return
    }

    setLoading(true)
    try {
      const result = await settingsApi.updateSMTP({
        ...smtpForm,
        port: parseInt(smtpForm.port)
      })
      if (result.success) {
        toast.success('SMTP设置已保存')
      } else {
        toast.error(result.message || '保存失败')
      }
    } catch (error) {
      toast.error('保存设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSystemSettings = async () => {
    setLoading(true)
    try {
      const result = await settingsApi.update({
        reminder_time: systemSettings.reminder_time,
        reminder_enabled: systemSettings.reminder_enabled.toString(),
        advance_days_default: systemSettings.advance_days_default,
        server_port: systemSettings.server_port
      })
      if (result.success) {
        toast.success('系统设置已保存')
      } else {
        toast.error(result.message || '保存失败')
      }
    } catch (error) {
      toast.error('保存设置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">系统设置</h2>

      <Tabs defaultValue="password" className="space-y-4">
        <TabsList>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="h-4 w-4" />
            密码管理
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-2">
            <Mail className="h-4 w-4" />
            邮件设置
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Settings className="h-4 w-4" />
            系统配置
          </TabsTrigger>
        </TabsList>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>
                更新您的登录密码，密码要求至少8位，包含大小写字母和数字
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? '保存中...' : '修改密码'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Tab */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>SMTP 邮件配置</CardTitle>
              <CardDescription>
                配置邮件服务器，用于发送生日提醒邮件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP服务器</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.example.com"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">端口</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    placeholder="465"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">用户名</Label>
                  <Input
                    id="smtp-user"
                    placeholder="your@email.com"
                    value={smtpForm.user}
                    onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">密码/授权码</Label>
                  <Input
                    id="smtp-pass"
                    type="password"
                    placeholder="******"
                    value={smtpForm.pass}
                    onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-from">发件人邮箱</Label>
                  <Input
                    id="smtp-from"
                    type="email"
                    placeholder="默认使用用户名"
                    value={smtpForm.from}
                    onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SSL/TLS</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={smtpForm.secure}
                      onCheckedChange={(checked) => setSmtpForm({ ...smtpForm, secure: checked })}
                    />
                    <Label className="font-normal">启用SSL加密</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleTestSMTP} disabled={testing}>
                  <TestTube className="h-4 w-4 mr-2" />
                  {testing ? '测试中...' : '测试连接'}
                </Button>
                <Button onClick={handleSaveSMTP} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? '保存中...' : '保存设置'}
                </Button>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">常见邮箱SMTP配置：</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>QQ邮箱：smtp.qq.com:465，需使用授权码</li>
                      <li>163邮箱：smtp.163.com:465，需使用授权码</li>
                      <li>阿里云邮箱：smtp.aliyun.com:465</li>
                      <li>Gmail：smtp.gmail.com:587，需开启应用专用密码</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>系统配置</CardTitle>
              <CardDescription>
                配置提醒时间、服务端口等系统参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用生日提醒</Label>
                  <p className="text-sm text-muted-foreground">
                    开启后系统将自动发送生日提醒邮件
                  </p>
                </div>
                <Switch
                  checked={systemSettings.reminder_enabled}
                  onCheckedChange={(checked) => 
                    setSystemSettings({ ...systemSettings, reminder_enabled: checked })
                  }
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminder-time">每日提醒时间</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={systemSettings.reminder_time}
                    onChange={(e) => 
                      setSystemSettings({ ...systemSettings, reminder_time: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">北京时间 (Asia/Shanghai)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advance-days">默认提前提醒天数</Label>
                  <Select
                    value={systemSettings.advance_days_default}
                    onValueChange={(v) => 
                      setSystemSettings({ ...systemSettings, advance_days_default: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">当天提醒</SelectItem>
                      <SelectItem value="1">1天前</SelectItem>
                      <SelectItem value="2">2天前</SelectItem>
                      <SelectItem value="3">3天前</SelectItem>
                      <SelectItem value="5">5天前</SelectItem>
                      <SelectItem value="7">7天前</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="server-port">服务端口</Label>
                <Input
                  id="server-port"
                  type="number"
                  value={systemSettings.server_port}
                  onChange={(e) => 
                    setSystemSettings({ ...systemSettings, server_port: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  修改端口后需要重启服务才能生效
                </p>
              </div>
              <Button onClick={handleSaveSystemSettings} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? '保存中...' : '保存设置'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
