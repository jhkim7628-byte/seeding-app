'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface StaffMember {
  id: string
  email: string
  role: 'admin' | 'editor'
  name?: string
  department?: string
  phone?: string
  created_at: string
}

interface CampaignCount {
  manager_id: string
  count: number
}

export default function StaffPage() {
  const [members, setMembers] = useState<StaffMember[]>([])
  const [campaignCounts, setCampaignCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('team_members').select('*').order('created_at')
    setMembers(data || [])

    // 직원별 캠페인 수
    const camps = await fetch('/api/campaigns').then(r=>r.json())
    if (Array.isArray(camps)) {
      const counts: Record<string, number> = {}
      camps.forEach((c: any) => {
        if (c.manager_id) counts[c.manager_id] = (counts[c.manager_id] || 0) + 1
      })
      setCampaignCounts(counts)
    }
    setLoading(false)
  }

  const totalActive = members.length
  const adminCount = members.filter(m => m.role === 'admin').length

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">전체 직원 목록</h1>
          <span className="chip chip-green">{members.length}명</span>
        </div>
        <Link href="/admin" className="btn-primary">+ 신규 직원 등록</Link>
      </div>

      <div className="p-7">
        {/* KPI */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="card">
            <div className="card-body">
              <div className="text-[11px] text-gray-500 mb-1">전체 직원</div>
              <div className="text-2xl font-black text-gray-900 font-mono">{totalActive} <span className="text-sm font-medium text-gray-500">명</span></div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-[11px] text-gray-500 mb-1">관리자</div>
              <div className="text-2xl font-black text-[#1D9E75] font-mono">{adminCount} <span className="text-sm font-medium text-gray-500">명</span></div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-[11px] text-gray-500 mb-1">진행 캠페인</div>
              <div className="text-2xl font-black text-[#3182CE] font-mono">{Object.values(campaignCounts).reduce((a,b)=>a+b, 0)} <span className="text-sm font-medium text-gray-500">개</span></div>
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="card bg-blue-50 border-blue-200 mb-5">
          <div className="card-body">
            <div className="text-xs text-blue-800 leading-relaxed">
              💡 직원 추가는 <Link href="/admin" className="underline font-semibold">팀원 관리</Link> 페이지에서 이메일 초대로 진행돼요.
              초대받은 직원이 가입하면 여기에 자동으로 표시됩니다.
            </div>
          </div>
        </div>

        {/* 직원 목록 */}
        <div className="card">
          <div className="card-header"><span className="card-title">직원 정보</span></div>
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">👥</div>
              등록된 직원이 없어요
            </div>
          ) : (
            <div>
              <div className="bg-[#0D1117] grid text-[10px] text-gray-400 font-semibold uppercase tracking-wide"
                style={{gridTemplateColumns:'1fr 100px 100px 90px 80px'}}>
                {['직원','역할','입사일','캠페인','상태'].map(h => (
                  <div key={h} className="px-3 py-2">{h}</div>
                ))}
              </div>
              {members.map(m => (
                <div key={m.id} className="grid border-b border-gray-50 hover:bg-gray-50 transition-colors items-center"
                  style={{gridTemplateColumns:'1fr 100px 100px 90px 80px'}}>
                  <div className="px-3 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0D1117] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {m.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{m.name || m.email.split('@')[0]}</div>
                      <div className="text-[11px] text-gray-500 truncate">{m.email}</div>
                    </div>
                  </div>
                  <div className="px-3 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.role==='admin'?'bg-[#E6F7F1] text-[#0F6E56]':'bg-blue-50 text-blue-700'}`}>
                      {m.role==='admin'?'관리자':'편집자'}
                    </span>
                  </div>
                  <div className="px-3 py-3 text-xs text-gray-600 font-mono">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('ko-KR') : '—'}
                  </div>
                  <div className="px-3 py-3">
                    <span className="text-sm font-bold text-gray-900 font-mono">{campaignCounts[m.id] || 0}</span>
                    <span className="text-xs text-gray-500 ml-1">개</span>
                  </div>
                  <div className="px-3 py-3">
                    <span className="chip chip-green text-[10px]">활성</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
