import { NextRequest, NextResponse } from 'next/server'

// 미들웨어 임시 비활성화 — 모든 요청 통과
// (인증은 클라이언트에서 처리)
export async function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
