import { Suspense } from 'react'
import VideoClient from './client'

export default function VideoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>}>
      <VideoClient />
    </Suspense>
  )
}
