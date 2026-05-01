'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface NavItem {
  href?: string
  icon?: string
  label?: string
  section?: string
  adminOnly?: boolean
  badge?: string
}

const NAV: NavItem[] = [
  { section: '대시보드' },
  { href: '/', icon: '🏠', label: '메인' },
  { href: '/dashboard', icon: '📊', label: '광고 대시보드' },

  { section: '캠페인 관리' },
  { href: '/campaigns', icon: '📢', label: '캠페인' },
  { href: '/persona', icon: '🙋', label: '페르소나 관리' },
  { href: '/persona-gen', icon: '✨', label: '페르소나 자동 생성', badge: 'NEW' },
  { href: '/script', icon: '📝', label: '대본 라이브러리' },
  { href: '/templates', icon: '💬', label: '시딩 문구' },

  { section: '리소스 관리' },
  { href: '/products', icon: '🥬', label: '상품 관리' },
  { href: '/influencer', icon: '🌟', label: '인플루언서' },
  { href: '/staff', icon: '👥', label: '직원 관리' },

  { section: '시스템' },
  { href: '/guide', icon: '📖', label: '사용 가이드' },
  { href: '/setting', icon: '⚙️', label: '설정' },
  { href: '/admin', icon: '🔐', label: '관리자', adminOnly: true },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('team_members').select('role').eq('user_id', user.id).single()
      setUser({ email: user.email || '', role: data?.role || 'editor' })
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 bg-[#0D1117] flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0">
      {/* 로고 */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1D9E75] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🌿</span>
          </div>
          <div>
            <div className="text-white text-[13px] font-semibold leading-none">현신바이오</div>
            <div className="text-gray-500 text-[10px] mt-0.5">시딩 캠페인 관리</div>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 px-2 pb-4 pt-2">
        {NAV.map((item, i) => {
          if ('section' in item && item.section) {
            return (
              <div key={i} className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest px-2 pt-3 pb-1">
                {item.section}
              </div>
            )
          }
          if (item.adminOnly && user?.role !== 'admin') return null
          const active = item.href === '/' ? path === '/' : path?.startsWith(item.href || '')
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs my-0.5 ${
                active ? 'bg-[#1D9E75] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[8px] bg-[#1D9E75] text-white px-1 py-0.5 rounded font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* 사용자 */}
      {user && (
        <div className="border-t border-gray-800 px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-white text-[11px]">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-white truncate">{user.email}</div>
              <div className="text-[9px] text-gray-500">{user.role}</div>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-white text-[11px]" title="로그아웃">
              ⏻
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
