'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarDays, 
  Users, 
  Settings, 
  LogOut, 
  User, 
  Menu,
  Bell,
  Mail,
  History
} from 'lucide-react'
import BirthdaysList from '@/components/birthdays/BirthdaysList'
import UpcomingBirthdays from '@/components/birthdays/UpcomingBirthdays'
import SettingsPanel from '@/components/settings/SettingsPanel'
import EmailLogs from '@/components/settings/EmailLogs'
import { birthdaysApi } from '@/lib/api'
import { useBirthdaysStore } from '@/stores/birthdays'
import { toast } from 'sonner'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const { user, logout } = useAuthStore()
  const { setBirthdays, setUpcoming, setDepartments } = useBirthdaysStore()

  const handleLogout = () => {
    logout()
    toast.success('已退出登录')
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [birthdaysRes, upcomingRes, departmentsRes] = await Promise.all([
          birthdaysApi.list(),
          birthdaysApi.upcoming(30),
          birthdaysApi.departments()
        ])

        if (birthdaysRes.success && birthdaysRes.data) {
          setBirthdays(birthdaysRes.data)
        }
        if (upcomingRes.success && upcomingRes.data) {
          setUpcoming(upcomingRes.data)
        }
        if (departmentsRes.success && departmentsRes.data) {
          setDepartments(departmentsRes.data)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [setBirthdays, setUpcoming, setDepartments])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🎂</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
              Birthdays Reminder Pro
            </h1>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 max-w-sm w-full">
            <Input
              placeholder="搜索生日记录..."
              className="w-full"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                    {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium">{user?.name || '管理员'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="w-fit mt-1">
                  {user?.role === 'admin' ? '管理员' : '用户'}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                <User className="mr-2 h-4 w-4" />
                个人设置
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                系统设置
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 transition-transform duration-200
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-white border-r shadow-sm md:shadow-none
          md:block
        `}>
          <div className="p-4 space-y-2 mt-16 md:mt-0">
            <Button
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => {
                setActiveTab('dashboard')
                setSidebarOpen(false)
              }}
            >
              <CalendarDays className="h-4 w-4" />
              仪表盘
            </Button>
            <Button
              variant={activeTab === 'birthdays' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => {
                setActiveTab('birthdays')
                setSidebarOpen(false)
              }}
            >
              <Users className="h-4 w-4" />
              生日管理
            </Button>
            <Button
              variant={activeTab === 'logs' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => {
                setActiveTab('logs')
                setSidebarOpen(false)
              }}
            >
              <History className="h-4 w-4" />
              发送日志
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => {
                setActiveTab('settings')
                setSidebarOpen(false)
              }}
            >
              <Settings className="h-4 w-4" />
              系统设置
            </Button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {activeTab === 'dashboard' && (
            <UpcomingBirthdays />
          )}
          {activeTab === 'birthdays' && (
            <BirthdaysList />
          )}
          {activeTab === 'logs' && (
            <EmailLogs />
          )}
          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-4 px-6 text-center text-sm text-muted-foreground">
        <p>Birthdays Reminder Pro © {new Date().getFullYear()} - 企业级生日提醒管理系统</p>
      </footer>
    </div>
  )
}
