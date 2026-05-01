import { Suspense } from 'react'
import SeedClient from './client'

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>}>
      <SeedClient />
    </Suspense>
  )
}
