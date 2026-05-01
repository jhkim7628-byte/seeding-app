'use client'
import { useEffect, useState } from 'react'
import { ProductSetting } from '@/types'

const DEFAULT: ProductSetting = {
  name:'식이섬유샷',
  sogu:[
    {icon:'🥦',main:'슈퍼푸드 8종이 담긴 알약',sub:'케일·브로콜리·양배추·생강·아스파라거스 등 국내산 천연 야채'},
    {icon:'⚖️',main:'야채 1.2kg = 단 두 알',sub:'매일 1.2kg 야채를 먹을 수 있어요? → 하루 야채 권장량'},
    {icon:'💊',main:'두 알로 간편하고 꾸준히',sub:'찬밥 먹으면서 두 알. 귀찮아서 포기한 나도 됐어요'},
    {icon:'📊',main:'불용성·수용성 2:1 황금비율',sub:'논문으로 검증된 비율'},
  ],
  tags:['#식이섬유샷','#장건강','#저속노화','#야채섭취','#식이섬유'],
  warns:['살이 빠진다 지방이 분해된다 등 직접 효능 표현 금지','수치 기반 효과 보장 금지','의학적 표현 금지','[광고] 또는 #광고 표기 필수','댓글 할인 링크 CTA 금지'],
  ref:'리뷰 10,000개 이상 · 아이도 안심하고 먹을 수 있는 성분 · 국내산 천연 야채 원재료',
  mention:'야채 8종이 담긴 식이섬유샷, 하루 두 알로 야채 1.2kg 섭취',
  styles:['본인의 실제 경험 기반으로 자연스럽게 (광고 느낌 없이)','일상 장면 속에 제품이 자연스럽게 등장','체감 변화는 느낌·장면으로 표현 (수치 보장 없이)'],
  reqs:['제품 단상자 자연스럽게 1회 이상 노출','두 알 복용 장면 포함','영상 길이 30~60초 준수','[광고] 또는 #광고 표기 필수','업로드 4일 전 초안 제출'],
}

export default function SettingPage() {
  const [form, setForm] = useState<ProductSetting>(DEFAULT)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/settings').then(r=>r.json()).then(d => { if (d) setForm(d) })
  }, [])

  const set = (k:string, v:unknown) => setForm(f=>({...f,[k]:v}))
  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(''),2000) }

  async function save() {
    setSaving(true)
    await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    setSaving(false); showToast('✓ 저장 완료')
  }

  function addTag(e:React.KeyboardEvent) {
    if (e.key!=='Enter'&&e.key!==' ') return; e.preventDefault()
    if (!tagInput.trim()||form.tags.includes(tagInput.trim())) return
    set('tags',[...form.tags,tagInput.trim()]); setTagInput('')
  }

  const preview = `━━━━━━━━━━━━━━━━━━━━━━
📦 제품명 : ${form.name}
━━━━━━━━━━━━━━━━━━━━━━

💡 핵심 소구점
${form.sogu.map(s=>`${s.icon} ${s.main}\n   ${s.sub}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━
✍️ 멘션 작성 가이드
${form.mention}

표현 스타일
${form.styles.map(s=>`→ ${s}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━
✅ 필수 요청사항
${form.reqs.map((r,i)=>`${i+1}. ${r}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━
🚫 유의사항
${form.warns.map(w=>`• ${w}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━
ℹ️ 참고사항
${form.ref}

━━━━━━━━━━━━━━━━━━━━━━
해시태그
${form.tags.join(' ')}`

  return (
    <div>
      {toast && <div className="fixed bottom-6 right-6 bg-[#1D9E75] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg z-50">{toast}</div>}
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">제품 세팅</h1>
          <span className="chip chip-green">{form.name} 기본값</span>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setForm(DEFAULT)} className="btn-ghost">초기화</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving?'저장 중...':'💾 저장'}</button>
        </div>
      </div>

      <div className="p-7">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="card">
              <div className="card-header"><span className="card-title">기본 정보</span></div>
              <div className="card-body">
                <label className="text-[11px] font-semibold text-gray-600 mb-1 block">제품명</label>
                <input className="input" value={form.name} onChange={e=>set('name',e.target.value)}/>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">핵심 소구점</span>
                <button onClick={()=>set('sogu',[...form.sogu,{icon:'📌',main:'소구점 입력',sub:'부가 설명'}])} className="btn-sm">+ 추가</button>
              </div>
              <div className="card-body space-y-2">
                {form.sogu.map((s,i)=>(
                  <div key={i} className="flex items-start gap-2 p-3 bg-[#E6F7F1] rounded-lg border border-[#A7E3CE]">
                    <input value={s.icon} onChange={e=>set('sogu',form.sogu.map((v,j)=>j===i?{...v,icon:e.target.value}:v))} className="w-8 text-center bg-transparent border-none text-lg"/>
                    <div className="flex-1">
                      <input value={s.main} onChange={e=>set('sogu',form.sogu.map((v,j)=>j===i?{...v,main:e.target.value}:v))} className="w-full bg-transparent border-none text-xs font-semibold text-gray-900 mb-1"/>
                      <input value={s.sub} onChange={e=>set('sogu',form.sogu.map((v,j)=>j===i?{...v,sub:e.target.value}:v))} className="w-full bg-transparent border-none text-[11px] text-gray-600"/>
                    </div>
                    <button onClick={()=>set('sogu',form.sogu.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-400">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">해시태그</span></div>
              <div className="card-body">
                <input className="input mb-2" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} placeholder="#태그 입력 후 Enter"/>
                <div className="flex flex-wrap gap-1.5 min-h-6">
                  {form.tags.map((t,i)=>(
                    <span key={t} className="inline-flex items-center gap-1 chip chip-green">
                      {t}<button onClick={()=>set('tags',form.tags.filter((_,j)=>j!==i))} className="text-[#0F6E56]">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <div className="card-header">
                <span className="card-title">⚠️ 유의사항</span>
                <button onClick={()=>set('warns',[...form.warns,'유의사항 입력'])} className="btn-sm">+ 추가</button>
              </div>
              <div className="card-body space-y-1.5">
                {form.warns.map((w,i)=>(
                  <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-red-500 flex-shrink-0">🚫</span>
                    <input value={w} onChange={e=>set('warns',form.warns.map((v,j)=>j===i?e.target.value:v))} className="flex-1 bg-transparent border-none text-xs text-gray-800"/>
                    <button onClick={()=>set('warns',form.warns.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-400">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">✍️ 멘션 가이드</span></div>
              <div className="card-body space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">필수 멘션 문구</label>
                  <textarea className="textarea min-h-[60px]" value={form.mention} onChange={e=>set('mention',e.target.value)}/>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-gray-600">권장 표현 스타일</label>
                    <button onClick={()=>set('styles',[...form.styles,'스타일 입력'])} className="btn-sm">+ 추가</button>
                  </div>
                  <div className="space-y-1.5">
                    {form.styles.map((s,i)=>(
                      <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-blue-500 flex-shrink-0">→</span>
                        <input value={s} onChange={e=>set('styles',form.styles.map((v,j)=>j===i?e.target.value:v))} className="flex-1 bg-transparent border-none text-xs text-gray-800"/>
                        <button onClick={()=>set('styles',form.styles.filter((_,j)=>j!==i))} className="text-gray-400">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">✅ 필수 요청사항</span>
                <button onClick={()=>set('reqs',[...form.reqs,'요청사항 입력'])} className="btn-sm">+ 추가</button>
              </div>
              <div className="card-body space-y-1.5">
                {form.reqs.map((r,i)=>(
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#E6F7F1] rounded-lg border border-[#A7E3CE]">
                    <span className="text-[#1D9E75] flex-shrink-0">☑</span>
                    <input value={r} onChange={e=>set('reqs',form.reqs.map((v,j)=>j===i?e.target.value:v))} className="flex-1 bg-transparent border-none text-xs text-gray-800"/>
                    <button onClick={()=>set('reqs',form.reqs.filter((_,j)=>j!==i))} className="text-gray-400">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">📄 인플루언서 전달 미리보기</span>
                <button onClick={()=>navigator.clipboard.writeText(preview).then(()=>showToast('📋 복사 완료'))} className="btn-sm">복사</button>
              </div>
              <div className="card-body">
                <pre className="bg-gray-50 rounded-lg p-3 text-[11px] leading-loose text-gray-700 whitespace-pre-wrap border border-gray-200 max-h-64 overflow-y-auto">{preview}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
