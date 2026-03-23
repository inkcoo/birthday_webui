'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useBirthdaysStore } from '@/stores/birthdays'
import { CalendarDays, Gift, Clock, Users } from 'lucide-react'

export default function UpcomingBirthdays() {
  const { upcoming, birthdays } = useBirthdaysStore()

  const todayBirthdays = upcoming.filter(b => b.daysUntil === 0)
  const thisWeekBirthdays = upcoming.filter(b => b.daysUntil > 0 && b.daysUntil <= 7)
  const thisMonthBirthdays = upcoming.filter(b => b.daysUntil > 7 && b.daysUntil <= 30)

  const getDaysText = (days: number) => {
    if (days === 0) return '今天'
    if (days === 1) return '明天'
    return `${days}天后`
  }

  const getBadgeVariant = (days: number): "default" | "secondary" | "outline" | "destructive" => {
    if (days === 0) return 'destructive'
    if (days <= 7) return 'default'
    return 'secondary'
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总记录</p>
                <p className="text-2xl font-bold">{birthdays.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-full">
                <Gift className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">今日生日</p>
                <p className="text-2xl font-bold">{todayBirthdays.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <CalendarDays className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">本周生日</p>
                <p className="text-2xl font-bold">{thisWeekBirthdays.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">本月生日</p>
                <p className="text-2xl font-bold">{thisMonthBirthdays.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Birthdays */}
      {todayBirthdays.length > 0 && (
        <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-700">
              <Gift className="h-5 w-5" />
              🎉 今日生日
            </CardTitle>
            <CardDescription>今天是他们的特别日子，别忘了送上祝福！</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayBirthdays.map((birthday) => (
                <div
                  key={birthday.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-pink-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {birthday.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{birthday.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {birthday.birthYear ? `${birthday.age}岁 · ` : ''}
                        {birthday.birthMonth}月{birthday.birthDay}日
                        {birthday.calendarType === 'lunar' && ' (农历)'}
                      </p>
                    </div>
                  </div>
                  {birthday.department && (
                    <Badge variant="outline" className="mt-2">
                      {birthday.department}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming This Week */}
      {thisWeekBirthdays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-orange-600" />
              本周即将到来
            </CardTitle>
            <CardDescription>接下来7天内的生日</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {thisWeekBirthdays.map((birthday) => (
                <div
                  key={birthday.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {birthday.name[0]}
                    </div>
                    <div>
                      <h3 className="font-medium">{birthday.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {birthday.birthMonth}月{birthday.birthDay}日
                        {birthday.calendarType === 'lunar' && ' (农历)'}
                        {birthday.department && ` · ${birthday.department}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getBadgeVariant(birthday.daysUntil)}>
                    {getDaysText(birthday.daysUntil)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* This Month */}
      {thisMonthBirthdays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-green-600" />
              本月生日
            </CardTitle>
            <CardDescription>接下来30天内的生日</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {thisMonthBirthdays.map((birthday) => (
                <div
                  key={birthday.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{birthday.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {birthday.birthMonth}/{birthday.birthDay}
                    </span>
                  </div>
                  <Badge variant="secondary">{getDaysText(birthday.daysUntil)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {upcoming.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🎂</div>
            <h3 className="text-lg font-medium mb-2">暂无即将到来的生日</h3>
            <p className="text-muted-foreground">
              点击左侧"生日管理"添加第一条生日记录
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
