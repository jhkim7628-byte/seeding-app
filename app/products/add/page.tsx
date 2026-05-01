import { Suspense } from 'react'
import ProductAddClient from './client'

export default function ProductAddPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>}>
      <ProductAddClient />
    </Suspense>
  )
}
