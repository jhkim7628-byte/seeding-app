'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ScriptItem {
  id: string
  title: string
  ctr_type: string
  duration_seconds: number
  total_cuts: number
  status: string
  campaign_id?: string
  product_id: string
  persona_id: string
  cards: any[]
  created_at: string
  updated_at: string
}

export default function ScriptLibraryPage() {
  const [scripts, setScripts] = useState<ScriptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'finalized' | 'sent'>('all')
  const [personaMap, setPersonaMap] = useState<Record<string, string>>({})

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/scripts-v4')
      const data = await r.json()
      const list = Array.isArray(data) ? data : []
      setScripts(list)

      // 페르소나 이름 매핑
      const personaIds = Array.from(new Set(list.map((s) => s.persona_id).filter(Boolean)))
      const map: Record<string, string> = {}
      await Promise.all(
        personaIds.map(async (pid) => {
          try {
            const res = await fetch(`/api/personas/${pid}`)
            const p = await res.json()
            if (p?.name) map[pid] = p.name
          } catch {}
        })
      )
      setPersonaMap(map)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function deleteScript(id: string) {
    if (!confirm('정말 삭제할까요?')) return
    await fetch(`/api/scripts-v4/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = scripts.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const statusBadge = (status: string) => {
    if (status === 'sent')
      return <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full">✓ 발송됨</span>
    if (status === 'finalized')
      return (
        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full">📌 캠페인 연결</span>
      )
    return <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-full">📝 작성 중</span>
  }

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">📝 대본 라이브러리</h1>
          <span className="bg-[#E1F5EE] text-[#0F6E56] text-[10px] px-2 py-0.5 rounded-full font-medium">
            {scripts.length}개
          </span>
        </div>
        <Link
          href="/persona-gen"
          className="bg-[#1D9E75] text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#0F6E56]"
        >
          + 새 대본 만들기
        </Link>
      </div>

      <div className="p-7">
        {/* 필터 */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="🔍 대본 제목 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-sm px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <div className="flex gap-1">
            {(['all', 'draft', 'finalized', 'sent'] as const).map((s) => {
              const labels = { all: '전체', draft: '작성 중', finalized: '캠페인 연결', sent: '발송됨' }
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    filterStatus === s
                      ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {labels[s]}
                </button>
              )
            })}
          </div>
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <div className="text-4xl mb-3">📝</div>
            <div className="text-sm text-gray-700 mb-1">아직 만든 대본이 없어요</div>
            <div className="text-xs text-gray-500 mb-4">페르소나 자동 생성으로 첫 대본을 만들어보세요</div>
            <Link
              href="/persona-gen"
              className="bg-[#1D9E75] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#0F6E56] inline-block"
            >
              + 새 대본 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => {
              const validCuts = (s.cards || []).filter((c: any) => !c.is_excluded).length
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {statusBadge(s.status || 'draft')}
                    <div className="text-[10px] text-gray-400">
                      {new Date(s.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <Link href={`/script-editor?id=${s.id}`} className="block">
                    <div className="text-[13px] font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-[#1D9E75]">
                      {s.title}
                    </div>
                  </Link>
                  <div className="text-[11px] text-gray-500 mb-3 line-clamp-1">
                    {personaMap[s.persona_id] || '페르소나 정보 없음'}
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-[10px] text-gray-600">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{s.ctr_type}</span>
                    <span>{s.duration_seconds || 50}초</span>
                    <span>·</span>
                    <span>{validCuts}컷</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Link
                      href={`/script-editor?id=${s.id}`}
                      className="flex-1 bg-[#1D9E75] text-white text-[11px] font-medium text-center py-1.5 rounded hover:bg-[#0F6E56]"
                    >
                      ✏️ 편집
                    </Link>
                    <a
                      href={`/api/scripts-v4/${s.id}/pdf`}
                      target="_blank"
                      className="flex-1 bg-white border border-gray-200 text-gray-700 text-[11px] text-center py-1.5 rounded hover:bg-gray-50"
                    >
                      📄 PDF
                    </a>
                    <button
                      onClick={() => deleteScript(s.id)}
                      className="bg-white border border-gray-200 text-red-500 text-[11px] px-2 py-1.5 rounded hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
