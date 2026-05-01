'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Campaign } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  '임시':'bg-gray-100 text-gray-700',
  '대기':'bg-amber-100 text-amber-800',
  '활성':'bg-green-100 text-green-800',
  '완료':'bg-blue-100 text-blue-800',
  '취소':'bg-red-100 text-red-800',
}
const APPROVAL_COLORS: Record<string, string> = {
  '대기':'bg-amber-100 text-amber-800',
  '승인':'bg-green-100 text-green-800',
  '반려':'bg-red-100 text-red-800',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterApproval, setFilterApproval] = useState('all')
  const [filterType, setFilterType] = useState<'influencer'|'blog'>('influencer')

  useEffect(() => { load() }, [filterType])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/campaigns?type=${filterType}`)
    const data = await res.json()
    setCampaigns(Array.isArray(data)?data:[])
    setLoading(false)
  }

  async function deleteCampaign(id: string) {
    if (!confirm('캠페인을 삭제할까요?')) return
    await fetch(`/api/campaigns/${id}`, { method:'DELETE' })
    load()
  }

  let filtered = campaigns
  if (filterStatus !== 'all') filtered = filtered.filter(c => c.status === filterStatus)
  if (filterApproval !== 'all') filtered = filtered.filter(c => c.approval_status === filterApproval)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">{filterType==='influencer'?'인플루언서':'블로그'} 캠페인 관리</h1>
          <span className="chip chip-green">{campaigns.length}개</span>
        </div>
        <Link href={`/campaigns/add?type=${filterType}`} className="btn-primary">+ 캠페인 등록</Link>
      </div>

      <div className="p-7">
        {/* 타입 탭 */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          {[['influencer','📡 인플루언서'],['blog','📝 블로그']].map(([t,l]) => (
            <button key={t} onClick={()=>setFilterType(t as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${filterType===t?'border-[#1D9E75] text-[#1D9E75]':'border-transparent text-gray-500 hover:text-gray-900'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* 필터 */}
        <div className="flex flex-col gap-2 mb-4 items-end">
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-gray-500 mr-1">캠페인 상태</span>
            {['all','임시','대기','활성','완료','취소'].map(s => (
              <button key={s} onClick={()=>setFilterStatus(s)}
                className={`text-xs px-2.5 py-1 rounded-md border ${filterStatus===s?'bg-[#1D9E75] text-white border-[#1D9E75]':'bg-white text-gray-600 border-gray-200'}`}>
                {s==='all'?'전체':s}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-gray-500 mr-1">승인 상태</span>
            {['all','대기','승인','반려'].map(s => (
              <button key={s} onClick={()=>setFilterApproval(s)}
                className={`text-xs px-2.5 py-1 rounded-md border ${filterApproval===s?'bg-[#1D9E75] text-white border-[#1D9E75]':'bg-white text-gray-600 border-gray-200'}`}>
                {s==='all'?'전체':s}
              </button>
            ))}
          </div>
        </div>

        {/* 테이블 */}
        <div className="card overflow-hidden">
          <div className="bg-[#0D1117] grid text-[10px] text-gray-400 font-semibold uppercase tracking-wide"
            style={{gridTemplateColumns:'1fr 110px 90px 180px 130px 90px 90px 100px'}}>
            {['캠페인명','브랜드','담당자','기간','예산','상태','승인','관리'].map(h => (
              <div key={h} className="px-3 py-2">{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">📋</div>
              등록된 캠페인이 없어요
            </div>
          ) : filtered.map(c => (
            <div key={c.id} className="grid border-b border-gray-50 hover:bg-gray-50 transition-colors items-center"
              style={{gridTemplateColumns:'1fr 110px 90px 180px 130px 90px 90px 100px'}}>
              <Link href={`/campaigns/${c.id}`} className="px-3 py-3 cursor-pointer">
                <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                <div className="text-[10px] text-gray-400">{c.type==='influencer'?'인플루언서':'블로그'}</div>
              </Link>
              <div className="px-3 py-3 text-xs text-gray-700">{c.brand?.name || '—'}</div>
              <div className="px-3 py-3">
                <div className="flex items-center gap-1 text-[11px] text-gray-600">
                  <span>👥</span>
                  <span>{c.manager?.email ? '1명' : '0명'}</span>
                </div>
              </div>
              <div className="px-3 py-3 text-[11px] text-gray-600 font-mono">
                {c.start_date && c.end_date ? (
                  <>
                    <div>{c.start_date}</div>
                    <div className="text-gray-400">~ {c.end_date}</div>
                  </>
                ) : '—'}
              </div>
              <div className="px-3 py-3 text-xs font-semibold font-mono text-gray-900">
                {c.budget ? c.budget.toLocaleString()+'원' : '—'}
              </div>
              <div className="px-3 py-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[c.status]||'bg-gray-100'}`}>{c.status}</span>
              </div>
              <div className="px-3 py-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${APPROVAL_COLORS[c.approval_status]||'bg-gray-100'}`}>{c.approval_status}</span>
              </div>
              <div className="px-3 py-3 flex gap-1">
                <Link href={`/campaigns/${c.id}`} className="btn-sm">상세</Link>
                <button onClick={()=>c.id && deleteCampaign(c.id)} className="btn-sm text-red-500 hover:border-red-400">삭제</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
