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
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)

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

  async function generateScript() {
    if (!persona) { alert('먼저 페르소나를 선택해주세요'); return }
    if (!persona.persona) { alert('페르소나 정보가 부족해요. STEP 1에서 더 입력해주세요'); return }
    setGenerating(true); setGenError('')
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(persona),
      })
      const data = await res.json()
      if (data.error) {
        setGenError(data.error)
      } else {
        if (data.title && !title) setTitle(data.title)
        setScript(data.script || '')
        if (data.guide) setScenes(data.guide.split(' · ').filter(Boolean))
      }
    } catch (e:any) {
      setGenError('생성 실패: ' + (e.message||'알 수 없는 오류'))
    }
    setGenerating(false)
  }

  async function downloadPdf() {
    if (!title.trim() || !script.trim()) { alert('제목과 대본을 먼저 입력해주세요'); return }
    setDownloadingPdf(true)
    const personaData = persona ? {
      persona: persona.persona,
      vtype: persona.vtype,
      ctr: persona.ctr,
      tags: persona.tags,
    } : null
    const html = generatePdfHtml({
      title, script, scenes, inf, confirmed, score, grade,
      persona: personaData,
    })
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (w) {
      w.onload = () => {
        setTimeout(() => { w.print(); URL.revokeObjectURL(url) }, 500)
      }
    }
    setDownloadingPdf(false)
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
          <button onClick={downloadPdf} disabled={downloadingPdf} className="btn-ghost">
            {downloadingPdf ? 'PDF 생성 중...' : '📄 PDF 다운로드'}
          </button>
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
                  <button onClick={generateScript} disabled={generating || !persona}
                    className="text-xs px-3 py-1 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold disabled:opacity-50 hover:from-purple-600 hover:to-pink-600 transition-all">
                    {generating ? '✨ 생성 중...' : '✨ AI 대본 생성'}
                  </button>
                  {[['[CTR - 첫 3초]','CTR'],['[공감 스토리]','공감'],['[CVR - 결론/설득]','CVR']].map(([label,short]) => (
                    <button key={short} onClick={() => insertLabel(label)} className="btn-sm">{short}</button>
                  ))}
                </div>
              </div>
              <div className="card-body space-y-2">
                {genError && <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{genError}</div>}
                {!persona && <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">💡 먼저 위에서 페르소나를 선택해주세요. 그래야 AI가 대본을 생성할 수 있어요.</div>}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">영상 제목</label>
                  <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="예) 우리 애들 야채 안 먹을 때 식이섬유샷"/>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">대본 내용</label>
                  <textarea id="va_script" className="textarea font-normal" style={{minHeight:'320px',lineHeight:'2.1',fontSize:'13px'}}
                    value={script} onChange={e=>setScript(e.target.value)}
                    placeholder={'[CTR - 첫 3초]\n\n\n[공감 스토리]\n\n\n[CVR - 결론/설득]\n\n\n또는 ✨ AI 대본 생성 버튼을 눌러보세요'}/>
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
          <button onClick={downloadPdf} disabled={downloadingPdf} className="btn-ghost">
            {downloadingPdf ? 'PDF 생성 중...' : '📄 PDF 다운로드'}
          </button>
          <button onClick={() => router.back()} className="btn-ghost">취소</button>
          <button onClick={save} disabled={saving} className="btn-primary px-7 py-2 text-sm">
            {saving?'저장 중...':'✓ 저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

function generatePdfHtml(d: any) {
  const today = new Date().toLocaleDateString('ko-KR')
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${d.title || '시딩 캠페인'}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Noto Sans KR', sans-serif; color: #2D3748; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.7; }
.header { border-bottom: 3px solid #1D9E75; padding-bottom: 16px; margin-bottom: 24px; }
.brand { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.brand-dot { width: 28px; height: 28px; border-radius: 8px; background: #1D9E75; display: inline-flex; align-items: center; justify-content: center; }
.brand-name { font-size: 14px; font-weight: 700; color: #1D9E75; }
.title { font-size: 24px; font-weight: 900; color: #0D1117; margin-top: 8px; }
.subtitle { font-size: 13px; color: #718096; margin-top: 4px; }
.section { margin-bottom: 24px; page-break-inside: avoid; }
.section-title { font-size: 14px; font-weight: 700; color: #0D1117; border-left: 4px solid #1D9E75; padding-left: 10px; margin-bottom: 12px; }
.box { background: #F7FAFC; border-radius: 10px; padding: 14px 18px; }
.box-green { background: #E6F7F1; border-left: 4px solid #1D9E75; }
.box-red { background: #FFF5F5; border-left: 4px solid #E53E3E; }
.box-blue { background: #EBF8FF; border-left: 4px solid #3182CE; }
.script { background: #F7FAFC; padding: 18px; border-radius: 10px; white-space: pre-wrap; font-size: 13px; line-height: 2; border: 1px solid #E2E8F0; }
.info-grid { display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; font-size: 13px; }
.info-label { color: #718096; font-weight: 500; }
.info-value { color: #2D3748; font-weight: 500; }
.tag { display: inline-block; background: #E6F7F1; color: #0F6E56; font-size: 11px; padding: 3px 10px; border-radius: 20px; margin: 2px 3px 2px 0; }
.scene-list { display: grid; gap: 6px; }
.scene-item { padding: 8px 12px; background: white; border-left: 3px solid; border-radius: 6px; font-size: 12px; }
.checklist { list-style: none; }
.checklist li { padding: 4px 0; padding-left: 20px; position: relative; font-size: 13px; }
.checklist li:before { content: '✓'; position: absolute; left: 0; color: #1D9E75; font-weight: 700; }
.footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #A0AEC0; text-align: center; }
@media print {
  body { padding: 20px; }
  .section { page-break-inside: avoid; }
}
</style>
</head>
<body>

<div class="header">
  <div class="brand">
    <span class="brand-dot" style="color:white;font-size:14px">🌿</span>
    <span class="brand-name">현신바이오 · 식이섬유샷</span>
  </div>
  <div class="title">${d.title || '시딩 캠페인'}</div>
  <div class="subtitle">시딩 캠페인 기획서 · ${today}</div>
</div>

${d.persona ? `
<div class="section">
  <div class="section-title">📋 페르소나</div>
  <div class="box box-green">
    <div class="info-grid">
      <span class="info-label">페르소나</span><span class="info-value">${d.persona.persona || '—'}</span>
      <span class="info-label">영상 유형</span><span class="info-value">${d.persona.vtype || '—'}</span>
      <span class="info-label">CTR 유형</span><span class="info-value">${d.persona.ctr || '—'}</span>
    </div>
    ${d.persona.tags?.length ? `<div style="margin-top:10px">${d.persona.tags.map((t:string)=>`<span class="tag">${t}</span>`).join('')}</div>` : ''}
  </div>
</div>
` : ''}

<div class="section">
  <div class="section-title">📝 영상 대본</div>
  <div class="script">${d.script || '대본 미작성'}</div>
</div>

<div class="section">
  <div class="section-title">🎬 촬영 씬 가이드</div>
  <div class="scene-list">
    ${d.scenes.map((s:string,i:number) => {
      const labels = ['CTR 첫 3초','공감 스토리','CVR 제품','체감 변화','마무리']
      const colors = ['#E53E3E','#F59E0B','#1D9E75','#3182CE','#7C3AED']
      return `<div class="scene-item" style="border-left-color:${colors[i]||'#A0AEC0'}"><strong style="color:${colors[i]||'#A0AEC0'};font-size:11px">${labels[i]||'씬 '+(i+1)}</strong> · ${s}</div>`
    }).join('')}
  </div>
</div>

<div class="section">
  <div class="section-title">👤 인플루언서</div>
  <div class="box">
    <div class="info-grid">
      ${d.confirmed ? `<span class="info-label" style="color:#1D9E75">✓ 확정</span><span class="info-value" style="font-weight:700">${d.confirmed}</span>` : ''}
      ${d.inf.filter(Boolean).map((v:string,i:number)=>`<span class="info-label">후보 ${i+1}</span><span class="info-value">${v}</span>`).join('')}
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">✅ 필수 요청사항</div>
  <div class="box box-green">
    <ul class="checklist">
      <li>제품 단상자 자연스럽게 1회 이상 노출</li>
      <li>두 알 복용 장면 포함</li>
      <li>영상 길이 30~60초 준수</li>
      <li>[광고] 또는 #광고 표기 필수</li>
      <li>업로드 4일 전 초안 제출</li>
    </ul>
  </div>
</div>

<div class="section">
  <div class="section-title">🚫 유의사항</div>
  <div class="box box-red">
    <ul style="list-style:none;font-size:13px">
      <li style="padding:4px 0;padding-left:20px;position:relative">
        <span style="position:absolute;left:0;color:#E53E3E;font-weight:700">✕</span>
        과대광고 금지 (살이 빠진다, 변비 치료 등 효능 표현)
      </li>
      <li style="padding:4px 0;padding-left:20px;position:relative">
        <span style="position:absolute;left:0;color:#E53E3E;font-weight:700">✕</span>
        수치 기반 보장 금지 (○kg 감량 등)
      </li>
      <li style="padding:4px 0;padding-left:20px;position:relative">
        <span style="position:absolute;left:0;color:#E53E3E;font-weight:700">✕</span>
        댓글 할인 링크 CTA 형태 금지
      </li>
    </ul>
  </div>
</div>

<div class="footer">
  현신바이오 식이섬유샷 시딩 캠페인 · ${today} 생성
</div>

</body>
</html>`
}
