import { Suspense } from 'react'
import PersonaAddClient from './client'

export default function PersonaAddPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>}>
      <PersonaAddClient />
    </Suspense>
  )
}
