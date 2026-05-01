'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { section: '캠페인 관리' },
  { href: '/campaigns',     icon: '📡', label: '전체 캠페인' },
  { href: '/campaigns/add', icon: '➕', label: '캠페인 등록' },
  { section: '페르소나·대본' },
  { href: '/',              icon: '🙋', label: '페르소나 관리' },
  { href: '/persona/add',   icon: '✍️', label: '페르소나 정의' },
  { href: '/persona/video', icon: '🎬', label: '영상 기획 + AI' },
  { href: '/script',        icon: '📝', label: '대본 라이브러리' },
  { href: '/templates',     icon: '💬', label: '시딩 문구 템플릿' },
  { section: '데이터 관리' },
  { href: '/products',      icon: '📦', label: '상품 관리' },
  { href: '/influencer',    icon: '👤', label: '인플루언서 풀' },
  { href: '/staff',         icon: '👥', label: '직원 관리' },
  { section: '분석' },
  { href: '/dashboard',     icon: '📊', label: '성과 대시보드' },
  { href: '/guide',         icon: '🎥', label: '촬영 가이드' },
  { section: '설정' },
  { href: '/setting',       icon: '⚙️', label: '제품 세팅' },
  { href: '/admin',         icon: '🔐', label: '팀원 권한', adminOnly: true },
]

export default function Sidebar() {
  const path = usePathname()
  const [user, setUser] = useState<{email:string,role:string}|null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('team_members').select('role').eq('user_id', user.id).single()
      setUser({ email: user.email || '', role: data?.role || 'editor' })
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isAdmin = user?.role === 'admin'

  return (
    <aside className="w-60 bg-[#0D1117] flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#1D9E75] flex items-center justify-center text-sm">🌿</div>
          <div>
            <div className="text-xs font-bold text-white">현신바이오</div>
            <div className="text-[10px] text-gray-500">시딩 캠페인 관리</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 pb-4">
        {NAV.map((item, i) => {
          if ('section' in item) return (
            <div key={i} className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest px-2 pt-3 pb-1">{item.section}</div>
          )
          if ('adminOnly' in item && item.adminOnly && !isAdmin) return null
          const active = path === item.href || (item.href !== '/' && item.href !== '/campaigns/add' && item.href !== '/persona/add' && item.href !== '/persona/video' && path?.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`sidebar-item mb-0.5 ${active ? 'active' : ''}`}>
              <span className="w-4 text-center text-sm">{item.icon}</span>
              {item.label}
              {'adminOnly' in item && item.adminOnly && (
                <span className="ml-auto text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/60">관리자</span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-3 border-t border-white/5">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1D9E75] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-white font-medium truncate">{user.email}</div>
              <div className="text-[10px] text-gray-500">{user.role === 'admin' ? '관리자' : '편집자'}</div>
            </div>
            <button onClick={handleLogout} title="로그아웃"
              className="text-gray-500 hover:text-white transition-colors text-sm">↩</button>
          </div>
        ) : (
          <div className="h-8 bg-white/5 rounded-lg animate-pulse"/>
        )}
      </div>
    </aside>
  )
}
