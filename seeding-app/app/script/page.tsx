'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Persona } from '@/types'

export default function ScriptPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState<Persona|null>(null)

  useEffect(() => { fetch('/api/personas').then(r=>r.json()).then(d=>setPersonas(Array.isArray(d)?d:[])) }, [])

  const filtered = personas.filter(p => {
    if (filter === 'all') return true
    if (filter === '완료') return !!p.grade
    return p.ctr === filter
  })

  const CC: Record<string,string> = {'공감형':'#1D9E75','정보형':'#7C3AED','제품 직접형':'#3182CE'}

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">대본 라이브러리</h1>
          <span className="chip chip-green">{personas.length}개</span>
        </div>
        <Link href="/persona/video" className="btn-primary">+ 대본 추가</Link>
      </div>
      <div className="p-7">
        <div className="flex gap-2 mb-4">
          {[['all','전체'],['공감형','공감형'],['정보형','정보형'],['완료','성과 있음']].map(([f,l])=>(
            <button key={f} onClick={()=>setFilter(f)} className={`text-xs font-medium px-3 py-1 rounded-full border transition-all ${filter===f?'bg-[#1D9E75] text-white border-[#1D9E75]':'bg-white text-gray-600 border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75]'}`}>{l}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p=>(
            <div key={p.id} className="card overflow-hidden cursor-pointer hover:shadow-md hover:border-[#A7E3CE] transition-all" onClick={()=>setModal(p)}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">{p.persona}</div>
                  <div className="text-sm font-bold text-gray-900">{p.title||'제목 미입력'}</div>
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  <span className="chip text-[10px]" style={{background:(CC[p.ctr]||'#A0AEC0')+'22',color:CC[p.ctr]||'#A0AEC0'}}>{p.ctr}</span>
                  {p.grade && <span className="chip chip-purple">{p.grade}등급</span>}
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-4">{p.script||'대본 미작성'}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {(p.tags||[]).map(t=><span key={t} className="chip chip-gray">{t}</span>)}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-2 py-12 text-center text-gray-400">대본이 없어요</div>}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center" onClick={()=>setModal(null)}>
          <div className="bg-white rounded-2xl w-[640px] max-h-[80vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{modal.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modal.persona}</p>
              </div>
              <button onClick={()=>setModal(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <pre className="bg-gray-50 rounded-lg p-4 text-xs leading-loose text-gray-700 whitespace-pre-wrap border border-gray-200 max-h-72 overflow-y-auto">{modal.script||'대본 미작성'}</pre>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">촬영 가이드</div>
                <p className="text-xs text-gray-700 leading-relaxed">{modal.guide||'—'}</p>
              </div>
              <div className="flex justify-end">
                <Link href={`/persona/video?id=${modal.id}`} className="btn-primary text-sm">수정하기</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
