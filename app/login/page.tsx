import { Suspense } from 'react'
import LoginClient from './client'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>}>
      <LoginClient />
    </Suspense>
  )
}
