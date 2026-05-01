'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Persona } from '@/types'

const SCENE_LABELS = ['CTR 첫 3초','공감 스토리','CVR 제품','체감 변화','마무리']
const SCENE_COLORS = ['#E53E3E','#F59E0B','#1D9E75','#3182CE','#7C3AED']
const DEFAULT_SCENES = ['일상 장면으로 시작 (밥상 차리기 등)','공감 스토리 핵심 장면','단상자 클로즈업 · 두 알 복용 장면']

export default function VideoClient() {
  const router = useRouter()
  const params = useSearchParams()
  const personaId = params.get('id')
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selId, setSelId] = useState(personaId||'')
  const [persona, setPersona] = useState<Persona|null>(null)
  const [title, setTitle] = useState('')
  const [script, setScript] = useState('')
  const [scenes, setScenes] = useState<string[]>(DEFAULT_SCENES)
  const [inf, setInf] = useState(['','',''])
  const [confirmed, setConfirmed] = useState('')
  const [score, setScore] = useState('')
  const [grade, setGrade] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/personas').then(r=>r.json()).then(data => {
      setPersonas(Array.isArray(data)?data:[])
      if (personaId) {
        const found = data.find((p:Persona)=>p.id===personaId)
        if (found) loadPersona(found)
      }
    })
  }, [personaId])

  function loadPersona(p: Persona) {
    setPersona(p); setSelId(p.id||'')
    if (p.title) setTitle(p.title)
    if (p.script) setScript(p.script)
    if (p.guide) setScenes(p.guide.split(' · ').filter(Boolean))
    setInf(p.inf||['','',''])
    setConfirmed(p.confirmed||'')
    setScore(p.score?String(p.score):'')
    setGrade(p.grade||'')
  }

  function onSelectPersona(id: string) {
    setSelId(id)
    const found = personas.find(p=>p.id===id)
    if (found) loadPersona(found)
  }

  function insertLabel(label: string) {
    const ta = document.getElementById('va_script') as HTMLTextAreaElement
    const pos = ta.selectionStart
    const ins = '\n\n' + label + '\n'
    setScript(script.slice(0,pos)+ins+script.slice(pos))
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = pos+ins.length; ta.focus() }, 0)
  }

  async function save() {
    if (!title.trim()) { alert('영상 제목을 입력해주세요'); return }
    setSaving(true)
    const body = { title, script, guide: scenes.join(' · '), inf, confirmed, score:parseInt(score)||0, grade }
    const id = selId || personaId
    if (id) {
      await fetch(`/api/personas/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
    } else {
      await fetch('/api/personas', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({persona:'',ctr:'공감형',status:'기획',tags:[],...body}) })
    }
    setSaving(false)
    router.push('/')
  }

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">영상 기획</h1>
          <span className="chip chip-green">STEP 2 · 대본 · 씬 · 인플루언서 연결</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="btn-ghost">취소</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving?'저장 중...':'✓ 저장하기'}</button>
        </div>
      </div>
      <div className="p-7">
        <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-gray-200 mb-5">
          <div className="p-3 bg-[#E6F7F1] text-center cursor-pointer" onClick={() => router.push(selId?`/persona/add?id=${selId}`:'/persona/add')}>
            <div className="text-[10px] font-bold text-[#0F6E56] uppercase tracking-wider">STEP 1 ✓</div>
            <div className="text-sm font-bold text-[#0F6E56] mt-0.5">페르소나 정의 완료 ← 클릭하여 수정</div>
          </div>
          <div className="p-3 bg-[#1D9E75] text-center">
            <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">STEP 2</div>
            <div className="text-sm font-bold text-white mt-0.5">영상 기획</div>
          </div>
        </div>
        <div className="card mb-3.5">
          <div className="card-header"><span className="card-title">연결할 페르소나</span></div>
          <div className="card-body">
            <select className="select max-w-lg" value={selId} onChange={e=>onSelectPersona(e.target.value)}>
              <option value="">— 페르소나 선택 —</option>
              {personas.map(p => <option key={p.id} value={p.id}>{p.title||p.persona}</option>)}
            </select>
            {persona && (
              <div className="mt-3 p-3 bg-[#E6F7F1] rounded-lg border border-[#A7E3CE]">
                <div className="text-[11px] text-gray-600">{persona.persona}</div>
                <div className="text-sm font-bold text-gray-900 mt-0.5">{persona.title||'(제목 미입력)'}</div>
                {[persona.s1, persona.s2, persona.s3].filter(Boolean).map((s,i) => (
                  <div key={i} className="text-[11px] text-[#0F6E56] mt-1">→ {s}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5 items-start">
          <div className="space-y-3.5">
            <div className="card">
              <div className="card-header">
                <span className="card-title">📝 대본</span>
                <div className="flex gap-1.5">
                  {[['[CTR - 첫 3초]','CTR'],['[공감 스토리]','공감'],['[CVR - 결론/설득]','CVR']].map(([label,short]) => (
                    <button key={short} onClick={() => insertLabel(label)} className="btn-sm">{short}</button>
                  ))}
                </div>
              </div>
              <div className="card-body space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">영상 제목</label>
                  <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="예) 우리 애들 야채 안 먹을 때 식이섬유샷"/>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">대본 내용</label>
                  <textarea id="va_script" className="textarea font-normal" style={{minHeight:'320px',lineHeight:'2.1',fontSize:'13px'}}
                    value={script} onChange={e=>setScript(e.target.value)}
                    placeholder={'[CTR - 첫 3초]\n\n\n[공감 스토리]\n\n\n[CVR - 결론/설득]'}/>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">CTR · 공감 · CVR 버튼으로 구조를 잡아보세요</span>
                    <span className="text-[10px] text-gray-400">{script.length}자</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">👁 대본 미리보기</span></div>
              <div className="card-body">
                <pre className="bg-gray-50 rounded-lg p-3 text-xs leading-loose text-gray-700 whitespace-pre-wrap border border-gray-200 min-h-16 max-h-64 overflow-y-auto">
                  {script || '대본을 입력하면 여기에 미리보기가 표시됩니다'}
                </pre>
              </div>
            </div>
          </div>
          <div className="space-y-3.5">
            <div className="card">
              <div className="card-header">
                <span className="card-title">🎬 촬영 씬 가이드</span>
                <button onClick={() => setScenes([...scenes,'장면 방향 입력'])} className="btn-sm">+ 씬 추가</button>
              </div>
              <div className="card-body space-y-2">
                {scenes.map((s,i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border-l-[3px]" style={{borderColor:SCENE_COLORS[i]||'#A0AEC0'}}>
                    <span className="text-[10px] font-bold w-14 flex-shrink-0" style={{color:SCENE_COLORS[i]||'#A0AEC0'}}>{SCENE_LABELS[i]||'씬 '+(i+1)}</span>
                    <input value={s} onChange={e=>setScenes(scenes.map((v,j)=>j===i?e.target.value:v))}
                      className="flex-1 border-none bg-transparent text-xs text-gray-800 focus:outline-none"/>
                    <button onClick={() => setScenes(scenes.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-400 text-sm">✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">👤 인플루언서</span></div>
              <div className="card-body space-y-2">
                {[0,1,2].map(i => (
                  <div key={i}>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">후보 {i+1}</label>
                    <input className="input" value={inf[i]} onChange={e=>setInf(inf.map((v,j)=>j===i?e.target.value:v))} placeholder="@계정명 (플랫폼·팔로워)"/>
                  </div>
                ))}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">최종 확정</label>
                  <input className="input" value={confirmed} onChange={e=>setConfirmed(e.target.value)} placeholder="확정된 인플루언서"/>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">📊 성과</span></div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">의도 유사율 (%)</label>
                    <input type="number" min="0" max="100" className="input" value={score} onChange={e=>setScore(e.target.value)} placeholder="0~100"/>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">성과 등급</label>
                    <select className="select" value={grade} onChange={e=>setGrade(e.target.value)}>
                      <option value="">미측정</option>
                      <option value="S">S — 탁월</option>
                      <option value="A">A — 우수</option>
                      <option value="B">B — 보통</option>
                      <option value="C">C — 미흡</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-5 border-t border-gray-200">
          <button onClick={() => router.back()} className="btn-ghost">취소</button>
          <button onClick={save} disabled={saving} className="btn-primary px-7 py-2 text-sm">
            {saving?'저장 중...':'✓ 저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
