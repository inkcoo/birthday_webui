'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useBirthdaysStore } from '@/stores/birthdays'
import { birthdaysApi } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Search, Filter, Download, Upload } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface BirthdayForm {
  name: string
  birthYear: string
  birthMonth: string
  birthDay: string
  calendarType: string
  department: string
  email: string
  phone: string
  notes: string
  advanceDays: number
}

const initialForm: BirthdayForm = {
  name: '',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  calendarType: 'solar',
  department: '',
  email: '',
  phone: '',
  notes: '',
  advanceDays: 0
}

export default function BirthdaysList() {
  const { birthdays, departments, setBirthdays, addBirthday, updateBirthday, removeBirthday } = useBirthdaysStore()
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterCalendar, setFilterCalendar] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<BirthdayForm>(initialForm)

  // Filter birthdays
  const filteredBirthdays = birthdays.filter(b => {
    if (!b.isActive) return false
    if (search && !b.name.includes(search) && !b.department?.includes(search)) return false
    if (filterDept && b.department !== filterDept) return false
    if (filterCalendar && b.calendarType !== filterCalendar) return false
    return true
  })

  const handleOpenAdd = () => {
    setEditingId(null)
    setForm(initialForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (id: string) => {
    const birthday = birthdays.find(b => b.id === id)
    if (birthday) {
      setEditingId(id)
      setForm({
        name: birthday.name,
        birthYear: birthday.birthYear?.toString() || '',
        birthMonth: birthday.birthMonth.toString(),
        birthDay: birthday.birthDay.toString(),
        calendarType: birthday.calendarType,
        department: birthday.department || '',
        email: birthday.email || '',
        phone: birthday.phone || '',
        notes: birthday.notes || '',
        advanceDays: birthday.advanceDays
      })
      setDialogOpen(true)
    }
  }

  const handleOpenDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    // Validation
    if (!form.name || !form.birthMonth || !form.birthDay) {
      toast.error('请填写必填项')
      return
    }

    const month = parseInt(form.birthMonth)
    const day = parseInt(form.birthDay)
    const year = form.birthYear ? parseInt(form.birthYear) : null

    if (month < 1 || month > 12) {
      toast.error('月份必须在1-12之间')
      return
    }
    if (day < 1 || day > 31) {
      toast.error('日期必须在1-31之间')
      return
    }

    setLoading(true)
    try {
      const data = {
        name: form.name,
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        calendarType: form.calendarType,
        department: form.department || null,
        email: form.email || null,
        phone: form.phone || null,
        notes: form.notes || null,
        advanceDays: form.advanceDays
      }

      if (editingId) {
        const result = await birthdaysApi.update(editingId, data)
        if (result.success && result.data) {
          updateBirthday(editingId, result.data)
          toast.success('更新成功')
          setDialogOpen(false)
        } else {
          toast.error(result.message || '更新失败')
        }
      } else {
        const result = await birthdaysApi.create(data)
        if (result.success && result.data) {
          addBirthday(result.data)
          toast.success('添加成功')
          setDialogOpen(false)
        } else {
          toast.error(result.message || '添加失败')
        }
      }
    } catch (error) {
      toast.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    setLoading(true)
    try {
      const result = await birthdaysApi.delete(deletingId)
      if (result.success) {
        removeBirthday(deletingId)
        toast.success('删除成功')
        setDeleteDialogOpen(false)
      } else {
        toast.error(result.message || '删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">生日管理</h2>
        <Button onClick={handleOpenAdd} className="bg-gradient-to-r from-purple-600 to-pink-600">
          <Plus className="h-4 w-4 mr-2" />
          添加生日
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索姓名、部门..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="全部部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部部门</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCalendar} onValueChange={setFilterCalendar}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                <SelectItem value="solar">公历</SelectItem>
                <SelectItem value="lunar">农历</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>生日</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>距生日</TableHead>
                  <TableHead>提前提醒</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBirthdays.map((birthday) => (
                  <TableRow key={birthday.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {birthday.name[0]}
                        </div>
                        <div>
                          <div>{birthday.name}</div>
                          {birthday.birthYear && (
                            <div className="text-xs text-muted-foreground">{birthday.age}岁</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {birthday.birthMonth}月{birthday.birthDay}日
                    </TableCell>
                    <TableCell>
                      <Badge variant={birthday.calendarType === 'lunar' ? 'secondary' : 'outline'}>
                        {birthday.calendarType === 'lunar' ? '农历' : '公历'}
                      </Badge>
                    </TableCell>
                    <TableCell>{birthday.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={birthday.daysUntil === 0 ? 'destructive' : birthday.daysUntil <= 7 ? 'default' : 'secondary'}>
                        {birthday.daysUntil === 0 ? '今天' : `${birthday.daysUntil}天`}
                      </Badge>
                    </TableCell>
                    <TableCell>{birthday.advanceDays === 0 ? '当天' : `${birthday.advanceDays}天前`}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(birthday.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(birthday.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBirthdays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {search || filterDept || filterCalendar ? '没有找到匹配的记录' : '暂无生日记录，点击"添加生日"开始'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑生日' : '添加生日'}</DialogTitle>
            <DialogDescription>
              {editingId ? '修改生日记录信息' : '添加新的生日记录'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthYear">出生年份</Label>
                <Input
                  id="birthYear"
                  type="number"
                  value={form.birthYear}
                  onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
                  placeholder="如：1990"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthMonth">月份 *</Label>
                <Input
                  id="birthMonth"
                  type="number"
                  min="1"
                  max="12"
                  value={form.birthMonth}
                  onChange={(e) => setForm({ ...form, birthMonth: e.target.value })}
                  placeholder="1-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDay">日期 *</Label>
                <Input
                  id="birthDay"
                  type="number"
                  min="1"
                  max="31"
                  value={form.birthDay}
                  onChange={(e) => setForm({ ...form, birthDay: e.target.value })}
                  placeholder="1-31"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendarType">日历类型</Label>
                <Select
                  value={form.calendarType}
                  onValueChange={(v) => setForm({ ...form, calendarType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solar">公历</SelectItem>
                    <SelectItem value="lunar">农历</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">部门</Label>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="如：技术部"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advanceDays">提前提醒天数</Label>
                <Select
                  value={form.advanceDays.toString()}
                  onValueChange={(v) => setForm({ ...form, advanceDays: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">当天</SelectItem>
                    <SelectItem value="1">1天前</SelectItem>
                    <SelectItem value="2">2天前</SelectItem>
                    <SelectItem value="3">3天前</SelectItem>
                    <SelectItem value="5">5天前</SelectItem>
                    <SelectItem value="7">7天前</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="13800138000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="其他备注信息"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条生日记录吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
