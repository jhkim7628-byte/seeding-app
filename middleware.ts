import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 로그인 페이지는 통과
  if (pathname.startsWith('/login')) return NextResponse.next()
  // API는 서버에서 자체 검증
  if (pathname.startsWith('/api')) return NextResponse.next()

  // 쿠키에서 세션 토큰 확인
  const token = req.cookies.get('sb-access-token')?.value
    || req.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
