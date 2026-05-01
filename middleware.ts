import { NextResponse, type NextRequest } from 'next/server'

// 미들웨어 임시 비활성화 (무한 리다이렉트 방지)
// 인증 체크는 각 페이지의 client-side에서 처리
export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
