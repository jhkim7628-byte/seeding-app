'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Persona } from '@/types'

const VTYPES = ['육아맘 공감형','브이로그형','친구 대화형','저속노화형','남편 문제 해결형','직장인 공감형','정보형']
const STEPS_LIST = ['기획','섭외','촬영','검수','완료']

const EMPTY: Omit<Persona,'id'> = {
  persona:'',who:'',goal:'',pain:'',pain_scene:'',
  d1:'',d2:'',d3:'',ctr:'공감형',vtype:'육아맘 공감형',
  s1:'',s2:'',s3:'',tags:[],status:'기획',
  title:'',script:'',guide:'',inf:['','',''],confirmed:'',score:0,grade:''
}

export default function PersonaAddContent() {
  const router = useRouter()
  const params = useSearchParams()
  const editId = params.get('id')
  const [form, setForm] = useState({ ...EMPTY })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!editId)

  useEffect(() => {
    if (!editId) return
    fetch('/api/personas').then(r=>r.json()).then(data => {
      const found = data.find((p: Persona) => p.id === editId)
      if (found) setForm(found)
      setLoading(false)
    })
  }, [editId])

  const set = (k: string, v: unknown) => setForm(f => ({...f, [k]:v}))

  function addTag(e: React.KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    const v = tagInput.trim()
    if (!v || form.tags.includes(v)) return
    set('tags', [...form.tags, v])
    setTagInput('')
  }

  async function save() {
    if (!form.persona.trim()) { alert('페르소나(고민)를 입력해주세요'); return }
    setSaving(true)
    const method = editId ? 'PATCH' : 'POST'
    const url = editId ? `/api/personas/${editId}` : '/api/personas'
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const saved = await res.json()
    setSaving(false)
    if (saved.id) router.push(`/persona/video?id=${saved.id}`)
    else router.push('/')
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">페르소나 정의</h1>
          <span className="chip chip-green">STEP 1 · 누구에게 말할 것인가</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="btn-ghost">취소</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? '저장 중...' : '저장 후 영상 기획 →'}</button>
        </div>
      </div>

      <div className="p-7">
        <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-gray-200 mb-5">
          <div className="p-3 bg-[#1D9E75] text-center">
            <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">STEP 1</div>
            <div className="text-sm font-bold text-white mt-0.5">페르소나 정의</div>
          </div>
          <div className="p-3 bg-gray-100 text-center">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">STEP 2</div>
            <div className="text-sm font-bold text-gray-400 mt-0.5">영상 기획</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 items-start">
          <div className="space-y-3.5">
            <div className="card">
              <div className="card-header"><span className="card-title">🙋 타깃 한 명 설정</span></div>
              <div className="card-body space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">페르소나 · 고민 <span className="text-red-400">*</span></label>
                  <input className="input" value={form.persona} onChange={e=>set('persona',e.target.value)} placeholder="예) 편식하는 자녀 건강 걱정하는 주부"/>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">구체적 인물 묘사</label>
                  <input className="input" value={form.who} onChange={e=>set('who',e.target.value)} placeholder="예) 아이 재우고 혼자 냉장고 앞에 서있는 34살 김지연"/>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">기획 목적</label>
                  <input className="input" value={form.goal} onChange={e=>set('goal',e.target.value)} placeholder="예) 야채 챙겨줬다는 안도감을 주기 위함"/>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">💬 고통 포인트</span></div>
              <div className="card-body space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">핵심 고통 (타깃의 언어로) <span className="text-red-400">*</span></label>
                  <textarea className="textarea min-h-[80px]" value={form.pain} onChange={e=>set('pain',e.target.value)} placeholder="예) 야 나 우리 애가 야채를 진짜 하나도 안 먹어"/>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">고통이 나타나는 일상 장면</label>
                  <textarea className="textarea min-h-[70px]" value={form.pain_scene} onChange={e=>set('pain_scene',e.target.value)} placeholder="예) 아침마다 야채 올려진 밥 치우고 고기만 먹는 아이"/>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">🎯 구매 결정 3순간</span></div>
              <div className="card-body space-y-2">
                {[
                  {k:'d1', label:'"나 얘기네"', color:'#1D9E75', bg:'#E6F7F1', ph:'CTR+공감에서 터지는 순간'},
                  {k:'d2', label:'"이게 진짜 되나?"', color:'#3182CE', bg:'#EBF8FF', ph:'수치·성분으로 신뢰 주는 순간'},
                  {k:'d3', label:'"나도 할 수 있겠다"', color:'#7C3AED', bg:'#F5F3FF', ph:'낮은 허들로 결심하는 순간'},
                ].map(({k,label,color,bg,ph}) => (
                  <div key={k} className="p-3 rounded-lg border-l-[3px]" style={{background:bg,borderColor:color}}>
                    <div className="text-[10px] font-bold mb-1.5" style={{color}}>{label}</div>
                    <input className="input bg-white" value={(form as Record<string,unknown>)[k] as string} onChange={e=>set(k,e.target.value)} placeholder={ph}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="card">
              <div className="card-header"><span className="card-title">📐 영상 방향</span></div>
              <div className="card-body space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">CTR 유형</label>
                  <select className="select" value={form.ctr} onChange={e=>set('ctr',e.target.value)}>
                    <option>공감형</option><option>정보형</option><option>제품 직접형</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">영상 유형</label>
                  <select className="select" value={form.vtype} onChange={e=>set('vtype',e.target.value)}>
                    {VTYPES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">진행 상태</label>
                  <select className="select" value={form.status} onChange={e=>set('status',e.target.value)}>
                    {STEPS_LIST.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">📋 기획 3줄 요약</span></div>
              <div className="card-body space-y-3">
                {[
                  {k:'s1', label:'이 영상을 보는 사람은 지금', color:'text-red-500', ph:'예) 야채 못 먹이는 게 죄책감이 돼서 지쳐있다'},
                  {k:'s2', label:'이 영상을 보고 나서', color:'text-blue-500', ph:'예) 이거 두 알이면 야채 챙겨줄 수 있겠다'},
                  {k:'s3', label:'그래서 반드시 보여줄 장면', color:'text-purple-500', ph:'예) 야채 골라내는 아이 + 두 알 건네주는 장면'},
                ].map(({k,label,color,ph}) => (
                  <div key={k}>
                    <label className={`text-[11px] font-semibold mb-1 block ${color}`}>{label}</label>
                    <textarea className="textarea min-h-[60px]" value={(form as Record<string,unknown>)[k] as string} onChange={e=>set(k,e.target.value)} placeholder={ph}/>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">🏷 태그</span></div>
              <div className="card-body">
                <input className="input mb-2" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} placeholder="#태그 입력 후 Enter"/>
                <div className="flex flex-wrap gap-1.5 min-h-6">
                  {form.tags.map((t,i) => (
                    <span key={t} className="inline-flex items-center gap-1 chip chip-green text-xs">
                      {t}
                      <button onClick={() => set('tags', form.tags.filter((_,j)=>j!==i))} className="text-[#0F6E56]">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-5 border-t border-gray-200">
          <button onClick={() => router.back()} className="btn-ghost">취소</button>
          <button onClick={save} disabled={saving} className="btn-primary px-7 py-2 text-sm">
            {saving ? '저장 중...' : '저장 후 영상 기획 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
