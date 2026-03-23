'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/lib/api'
import LoginPage from '@/components/auth/LoginPage'
import InitPage from '@/components/auth/InitPage'
import Dashboard from '@/components/layout/Dashboard'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  const [checking, setChecking] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const { isAuthenticated, token } = useAuthStore()

  useEffect(() => {
    checkInitStatus()
  }, [])

  useEffect(() => {
    // Verify token on mount
    if (token) {
      verifyToken()
    } else {
      setChecking(false)
    }
  }, [token])

  const checkInitStatus = async () => {
    try {
      const result = await authApi.checkInit()
      setInitialized(result.data?.initialized || false)
    } catch {
      setInitialized(false)
    }
  }

  const verifyToken = async () => {
    try {
      const result = await authApi.getMe()
      if (!result.success) {
        useAuthStore.getState().logout()
      }
    } catch {
      useAuthStore.getState().logout()
    } finally {
      setChecking(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!initialized) {
    return (
      <>
        <InitPage onComplete={() => setInitialized(true)} />
        <Toaster />
      </>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <Dashboard />
      <Toaster />
    </>
  )
}
