// app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { Persona } from '@/types'

const SC: Record<string,string> = {기획:'#A0AEC0',섭외:'#F59E0B',촬영:'#1D9E75',검수:'#3182CE',완료:'#7C3AED'}

export default function DashboardPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  useEffect(() => { fetch('/api/personas').then(r=>r.json()).then(d=>setPersonas(Array.isArray(d)?d:[])) }, [])

  const scored = personas.filter(p=>p.score>0)
  const avgScore = scored.length ? Math.round(scored.reduce((a,p)=>a+p.score,0)/scored.length) : 0
  const actions: {l:string,a:string,c:string}[] = []
  personas.forEach((p,i) => {
    if (p.status==='섭외'&&!p.confirmed) actions.push({l:`페르소나 ${i+1}`,a:'인플루언서 섭외 필요',c:'#F59E0B'})
    if (p.status==='완료'&&!p.score) actions.push({l:`페르소나 ${i+1}`,a:'성과 데이터 입력 필요',c:'#3182CE'})
    if (p.status==='진행'&&!p.confirmed) actions.push({l:`페르소나 ${i+1}`,a:'인플루언서 확정 필요',c:'#E53E3E'})
  })

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">성과 대시보드</h1>
          <span className="chip chip-green">실시간</span>
        </div>
      </div>
      <div className="p-7">
        <div className="grid grid-cols-5 gap-2.5 mb-5">
          {[
            {val:personas.filter(p=>p.status==='완료').length,label:'완료 캠페인',c:'#1D9E75',bc:'chip-green'},
            {val:avgScore?avgScore+'%':'—',label:'평균 유사율',c:'#3182CE',bc:'chip-blue'},
            {val:personas.filter(p=>p.status==='진행').length,label:'촬영 진행 중',c:'#F59E0B',bc:'chip-amber'},
            {val:personas.filter(p=>p.status==='섭외').length,label:'섭외 중',c:'#7C3AED',bc:'chip-purple'},
            {val:actions.length,label:'액션 필요',c:'#E53E3E',bc:'chip-red'},
          ].map((k,i)=>(
            <div key={i} className="card relative overflow-hidden pt-1">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{background:k.c}}/>
              <div className="p-4">
                <div className="text-2xl font-black font-mono" style={{color:k.c}}>{k.val}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="card">
            <div className="card-header"><span className="card-title">캠페인 현황</span></div>
            <div className="card-body p-0">
              <div className="bg-[#0D1117] grid text-[10px] text-gray-400 font-semibold uppercase tracking-wide" style={{gridTemplateColumns:'1fr 70px 70px 50px'}}>
                {['페르소나','상태','유사율','성과'].map(h=><div key={h} className="px-3 py-2">{h}</div>)}
              </div>
              {personas.map(p=>(
                <div key={p.id} className="grid border-b border-gray-50 hover:bg-gray-50" style={{gridTemplateColumns:'1fr 70px 70px 50px'}}>
                  <div className="px-3 py-2 text-xs truncate">{p.title||p.persona}</div>
                  <div className="px-3 py-2"><span className="text-[10px] font-semibold" style={{color:SC[p.status]}}>{p.status}</span></div>
                  <div className="px-3 py-2 text-xs font-bold font-mono" style={{color:p.score>=80?'#1D9E75':p.score>0?'#F59E0B':'#A0AEC0'}}>{p.score?p.score+'%':'—'}</div>
                  <div className="px-3 py-2 text-xs font-bold font-mono" style={{color:p.grade?{S:'#7C3AED',A:'#1D9E75',B:'#F59E0B',C:'#E53E3E'}[p.grade]:'#A0AEC0'}}>{p.grade||'—'}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">⚡ 액션 필요 항목</span></div>
            <div className="card-body space-y-2">
              {actions.length === 0
                ? <div className="text-gray-400 text-sm py-4 text-center">액션 필요 항목 없음 🎉</div>
                : actions.map((a,i)=>(
                  <div key={i} className="flex items-center gap-2.5 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:a.c}}/>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{a.l}</div>
                      <div className="text-[11px] text-gray-500">{a.a}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
