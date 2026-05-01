'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Persona } from '@/types'

const STEPS = ['기획','섭외','촬영','검수','완료']
const SC: Record<string,string> = {기획:'#A0AEC0',섭외:'#F59E0B',촬영:'#1D9E75',검수:'#3182CE',완료:'#7C3AED'}
const RC = ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6','#EC4899','#14B8A6','#6B7280','#A0AEC0']

export default function PersonaPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [filtered, setFiltered] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<Persona | null>(null)

  useEffect(() => { fetchPersonas() }, [])

  useEffect(() => {
    let res = personas
    if (filter !== 'all') {
      if (['장건강','다이어트'].includes(filter)) res = res.filter(p => p.tags?.some(t => t.includes(filter)))
      else res = res.filter(p => p.status === filter)
    }
    if (search) res = res.filter(p => p.persona.includes(search) || (p.title||'').includes(search))
    setFiltered(res)
  }, [personas, filter, search])

  async function fetchPersonas() {
    setLoading(true)
    const res = await fetch('/api/personas')
    const data = await res.json()
    setPersonas(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function deletePersona(id: string) {
    if (!confirm('삭제할까요?')) return
    await fetch(`/api/personas/${id}`, { method: 'DELETE' })
    fetchPersonas()
  }

  const total = personas.length
  const active = personas.filter(p => p.status === '촬영').length
  const recruit = personas.filter(p => p.status === '섭외').length
  const scored = personas.filter(p => p.score > 0)
  const avgScore = scored.length ? Math.round(scored.reduce((a,p) => a+p.score, 0)/scored.length) : 0
  const grades = personas.filter(p => p.grade).sort((a,b) => ['S','A','B','C'].indexOf(a.grade) - ['S','A','B','C'].indexOf(b.grade))

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">페르소나 관리</h1>
          <span className="chip chip-green">{total}개 · 주부 타깃</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(personas)} className="btn-ghost">↓ CSV</button>
          <Link href="/persona/add" className="btn-primary">+ 페르소나 추가</Link>
        </div>
      </div>

      <div className="p-7">
        {/* KPI */}
        <div className="grid grid-cols-5 gap-2.5 mb-5">
          {[
            { val: total, label: '전체 페르소나', color: '#A0AEC0', badge: '기획완료', bc: 'chip-gray' },
            { val: active, label: '촬영 진행 중', color: '#1D9E75', badge: 'Active', bc: 'chip-green' },
            { val: recruit, label: '섭외 중', color: '#F59E0B', badge: 'Pending', bc: 'chip-amber' },
            { val: avgScore ? avgScore+'%' : '—', label: '평균 유사율', color: '#3182CE', badge: scored.length+'건 측정', bc: 'chip-blue' },
            { val: grades[0]?.grade || '—', label: '최고 성과', color: '#7C3AED', badge: grades[0]?.persona?.substring(0,10)||'—', bc: 'chip-purple' },
          ].map((k,i) => (
            <div key={i} className="card relative overflow-hidden pt-1">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{background:k.color}}/>
              <div className="p-4">
                <div className="text-2xl font-black text-gray-900 font-mono" style={{color:i>0?k.color:undefined}}>{k.val}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{k.label}</div>
                <span className={`chip ${k.bc} mt-1.5`}>{k.badge}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3.5 flex-wrap">
          {[['all','전체'],['완료','완료'],['진행','진행 중'],['섭외','섭외 중'],['기획','기획'],['장건강','장건강'],['다이어트','다이어트']].map(([f,l]) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition-all ${filter===f ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75]'}`}>
              {l}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 페르소나 검색" className="ml-auto text-xs px-3 py-1 rounded-full border border-gray-200 bg-white focus:outline-none focus:border-[#1D9E75] w-48"/>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#0D1117] grid text-[10px] text-gray-400 font-semibold uppercase tracking-wide"
            style={{gridTemplateColumns:'36px 80px 1fr 130px 100px 70px 60px 90px'}}>
            {['#','진행도','페르소나 · 제목','인플루언서','촬영 포인트','유사율','성과','액션'].map(h => (
              <div key={h} className="px-3 py-2">{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">데이터 없음</div>
          ) : (
            filtered.map((r, fi) => {
              const si = STEPS.indexOf(r.status)
              const scC = r.score>=80?'#1D9E75':r.score>=60?'#F59E0B':'#E53E3E'
              const grC: Record<string,string> = {S:'#7C3AED',A:'#1D9E75',B:'#F59E0B',C:'#E53E3E'}
              return (
                <div key={r.id} className="grid border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  style={{gridTemplateColumns:'36px 80px 1fr 130px 100px 70px 60px 90px'}}>
                  {/* # */}
                  <div className="px-3 py-3 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{background:RC[fi]||'#6B7280'}}>{fi+1}</div>
                  </div>
                  {/* 진행도 */}
                  <div className="px-3 py-3">
                    <div className="flex gap-0.5 mb-1">
                      {STEPS.map((s,x) => (
                        <div key={s} className="w-3 h-1 rounded-sm" style={{background:x<si?'#1D9E75':x===si?SC[r.status]:'#E2E8F0'}}/>
                      ))}
                    </div>
                    <div className="text-[10px] font-semibold" style={{color:SC[r.status]}}>{r.status}</div>
                  </div>
                  {/* 페르소나 */}
                  <div className="px-3 py-3">
                    <div className="text-[10px] text-gray-400 mb-0.5 truncate">{r.persona}</div>
                    <div className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2">{r.title||'제목 미입력'}</div>
                    <div className="flex gap-1 flex-wrap">
                      {(r.tags||[]).map(t => <span key={t} className="chip chip-gray">{t}</span>)}
                      <span className="chip chip-green">{r.ctr}</span>
                    </div>
                  </div>
                  {/* 인플루언서 */}
                  <div className="px-3 py-3">
                    {r.confirmed
                      ? <div className="text-[11px] font-semibold text-[#1D9E75] bg-[#E6F7F1] px-2 py-0.5 rounded-md truncate">✓ {r.confirmed}</div>
                      : <div className="text-[10px] text-gray-400">미확정</div>}
                    <div className="mt-1 space-y-0.5">
                      {(r.inf||[]).filter(Boolean).map((v,i) => <div key={i} className="text-[10px] text-gray-500 truncate">{v}</div>)}
                    </div>
                  </div>
                  {/* 촬영 포인트 */}
                  <div className="px-3 py-3 text-[11px] text-gray-600 leading-relaxed line-clamp-3">{r.guide||'—'}</div>
                  {/* 유사율 */}
                  <div className="px-3 py-3 flex items-center">
                    {r.score > 0
                      ? <span className="text-lg font-black font-mono" style={{color:scC}}>{r.score}%</span>
                      : <span className="text-[11px] text-gray-400">—</span>}
                  </div>
                  {/* 성과 */}
                  <div className="px-3 py-3 flex items-center">
                    {r.grade
                      ? <span className="text-xl font-black font-mono" style={{color:grC[r.grade]}}>{r.grade}</span>
                      : <span className="text-[11px] text-gray-400">—</span>}
                  </div>
                  {/* 액션 */}
                  <div className="px-3 py-3 flex flex-col gap-1">
                    <button onClick={() => setModal(r)} className="btn-sm text-center">보기</button>
                    <Link href={`/persona/add?id=${r.id}`} className="btn-sm text-center block">수정</Link>
                    <button onClick={() => r.id && deletePersona(r.id)} className="btn-sm text-center text-red-500 hover:border-red-400">삭제</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 대본 보기 Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-[640px] max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">{modal.title||modal.persona}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modal.persona}</p>
              </div>
              <button onClick={() => setModal(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">대본 전문</div>
                <pre className="bg-gray-50 rounded-lg p-3 text-xs leading-loose text-gray-700 whitespace-pre-wrap border border-gray-200 max-h-64 overflow-y-auto">{modal.script||'대본 미작성'}</pre>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">촬영 가이드</div>
                <p className="text-xs text-gray-700 leading-relaxed">{modal.guide||'—'}</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(modal.tags||[]).map(t => <span key={t} className="chip chip-gray">{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function exportCSV(personas: Persona[]) {
  const h = ['순위','페르소나','제목','CTR유형','상태','확정인플루언서','유사율','성과']
  const rows = personas.map((p,i) => [i+1,p.persona,p.title,p.ctr,p.status,p.confirmed,p.score+'%',p.grade])
  const csv = [h,...rows].map(r=>r.map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv)
  a.download = '시딩캠페인.csv'; a.click()
}
