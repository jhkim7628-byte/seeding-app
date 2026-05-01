import { Suspense } from 'react'
import ScenesClient from './client'

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>}>
      <ScenesClient />
    </Suspense>
  )
}
