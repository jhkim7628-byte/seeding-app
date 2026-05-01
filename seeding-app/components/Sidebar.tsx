'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { section: '캠페인' },
  { href: '/',              icon: '📋', label: '페르소나 관리' },
  { href: '/influencer',    icon: '👤', label: '인플루언서 풀' },
  { href: '/dashboard',     icon: '📊', label: '성과 대시보드' },
  { section: '라이브러리' },
  { href: '/script',        icon: '📝', label: '대본 라이브러리' },
  { href: '/guide',         icon: '🎬', label: '촬영 가이드' },
  { section: '추가' },
  { href: '/persona/add',   icon: '🙋', label: '페르소나 정의' },
  { href: '/persona/video', icon: '✏️', label: '영상 기획' },
  { section: '설정' },
  { href: '/setting',       icon: '⚙️', label: '제품 세팅' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-60 bg-[#0D1117] flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0">
      {/* 로고 */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#1D9E75] flex items-center justify-content text-sm">🌿</div>
          <div>
            <div className="text-xs font-bold text-white">현신바이오</div>
            <div className="text-[10px] text-gray-500">시딩 캠페인 관리</div>
          </div>
        </div>
        {/* 제품 태그 */}
        <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/25 rounded-lg p-3">
          <div className="text-[10px] text-[#A7E3CE] font-semibold uppercase tracking-widest mb-2">제품 세팅</div>
          <div className="flex flex-wrap gap-1">
            {['식이섬유샷','8종 야채','1.2kg=2알','불용성·수용성 2:1','논문 검증'].map(t => (
              <span key={t} className="text-[10px] text-[#A7E3CE] bg-[#A7E3CE]/10 px-1.5 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>
      {/* 네비게이션 */}
      <nav className="flex-1 px-2 pb-4">
        {NAV.map((item, i) => {
          if ('section' in item) return (
            <div key={i} className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest px-2 pt-4 pb-1">{item.section}</div>
          )
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`sidebar-item mb-0.5 ${active ? 'active' : ''}`}>
              <span className="w-4 text-center text-sm">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      {/* 하단 통계 */}
      <div className="px-4 py-3 border-t border-white/5 space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-500">평균 유사율</span>
          <span className="text-white font-bold font-mono">—</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-500">완료 캠페인</span>
          <span className="text-white font-bold font-mono">—</span>
        </div>
      </div>
    </aside>
  )
}
