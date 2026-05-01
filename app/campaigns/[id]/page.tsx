'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Campaign, Persona, Scene, DEFAULT_SCENES } from '@/types'
import { generateCampaignPdf } from './pdf-generator'

const STATUS_OPTIONS = ['임시','대기','활성','완료','취소']
const APPROVAL_OPTIONS = ['대기','승인','반려']

const STATUS_COLORS: Record<string,string> = {
  '임시':'bg-gray-100 text-gray-700',
  '대기':'bg-amber-100 text-amber-800',
  '활성':'bg-green-100 text-green-800',
  '완료':'bg-blue-100 text-blue-800',
  '취소':'bg-red-100 text-red-800',
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [includePersonas, setIncludePersonas] = useState(true)
  const [savingScenes, setSavingScenes] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/campaigns/${id}`).then(r=>r.json()),
      fetch('/api/personas').then(r=>r.json()),
    ]).then(([c, p]) => {
      if (!c.error) {
        setCampaign(c)
        setScenes(c.scenes && c.scenes.length > 0 ? c.scenes : DEFAULT_SCENES)
      }
      setPersonas(Array.isArray(p) ? p.filter((x:Persona) => x.campaign_id === id) : [])
      setLoading(false)
    })
  }, [id])

  async function updateField(field: string, value: any) {
    if (!campaign) return
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({[field]: value}),
    })
    const data = await res.json()
    if (!data.error) setCampaign(data)
  }

  async function saveScenes(newScenes: Scene[]) {
    setScenes(newScenes)
    setSavingScenes(true)
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({scenes: newScenes}),
    })
    setSavingScenes(false)
  }

  function toggleScene(idx: number) {
    saveScenes(scenes.map((s,i) => i===idx ? {...s, enabled: !s.enabled} : s))
  }

  function updateSceneNote(idx: number, note: string) {
    setScenes(scenes.map((s,i) => i===idx ? {...s, note} : s))
  }

  function updateSceneImage(idx: number, image_url: string) {
    saveScenes(scenes.map((s,i) => i===idx ? {...s, image_url} : s))
  }

  function moveScene(idx: number, direction: 'up'|'down') {
    const target = direction==='up' ? idx-1 : idx+1
    if (target < 0 || target >= scenes.length) return
    const newScenes = [...scenes]
    ;[newScenes[idx], newScenes[target]] = [newScenes[target], newScenes[idx]]
    saveScenes(newScenes.map((s,i) => ({...s, order: i+1})))
  }

  async function deleteCampaign() {
    if (!confirm('캠페인을 삭제할까요?')) return
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    router.push('/campaigns')
  }

  async function downloadPdf() {
    if (!campaign) return
    setDownloading(true)
    const html = generateCampaignPdf(campaign, includePersonas ? personas : [], scenes.filter(s => s.enabled))
    const w = window.open('', '_blank', 'width=900,height=1100')
    if (w) { w.document.write(html); w.document.close() }
    setDownloading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>
  if (!campaign) return <div className="flex items-center justify-center h-64 text-gray-400">캠페인을 찾을 수 없어요</div>

  const product = campaign.product
  const brand = campaign.brand
  const brandColor = product?.brand_color || '#1D9E75'
  const enabledScenes = scenes.filter(s => s.enabled).length

  // 진행률
  const checks = [
    !!campaign.name,
    !!campaign.product_id,
    !!campaign.start_date && !!campaign.end_date,
    !!campaign.upload_date,
    enabledScenes >= 3,
    personas.length > 0,
    personas.some(p => p.script),
  ]
  const progress = Math.round((checks.filter(Boolean).length / checks.length) * 100)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/campaigns" className="text-gray-500 hover:text-gray-900">←</Link>
          <h1 className="text-[15px] font-bold text-gray-900">{campaign.name}</h1>
          <span className="chip chip-green">{campaign.type==='influencer'?'인플루언서':'블로그'}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[campaign.status]}`}>{campaign.status}</span>
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" checked={includePersonas} onChange={e=>setIncludePersonas(e.target.checked)} className="rounded"/>
            페르소나 포함
          </label>
          <button onClick={downloadPdf} disabled={downloading}
            className="text-white font-semibold text-sm px-4 py-1.5 rounded-lg transition-colors"
            style={{background: brandColor}}>
            {downloading ? 'PDF 생성 중...' : '📄 PDF 다운로드'}
          </button>
          <button onClick={deleteCampaign} className="btn-ghost text-red-500">삭제</button>
        </div>
      </div>

      <div className="p-7 max-w-5xl mx-auto space-y-4">

        {/* 진행률 */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">캠페인 준비 진행률</span>
              <span className="text-xs font-bold" style={{color: brandColor}}>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 rounded-full transition-all" style={{width: progress+'%', background: brandColor}}/>
            </div>
          </div>
        </div>

        {/* 상태 + 카운터 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="card-body">
              <label className="text-[11px] font-semibold text-gray-600 mb-1 block">캠페인 상태</label>
              <select className="select" value={campaign.status} onChange={e=>updateField('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <label className="text-[11px] font-semibold text-gray-600 mb-1 block">승인 상태</label>
              <select className="select" value={campaign.approval_status} onChange={e=>updateField('approval_status', e.target.value)}>
                {APPROVAL_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-black font-mono" style={{color: brandColor}}>{personas.length}</div>
              <div className="text-[11px] text-gray-500">연결된 페르소나</div>
            </div>
          </div>
        </div>

        {/* 캠페인 + 제품 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header"><span className="card-title">📋 캠페인 정보</span></div>
            <div className="card-body grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500 text-xs">브랜드</span><div className="font-medium">{brand?.name||'—'}</div></div>
              <div><span className="text-gray-500 text-xs">예산</span><div className="font-medium font-mono">{campaign.budget?.toLocaleString()}원</div></div>
              <div><span className="text-gray-500 text-xs">시작일</span><div className="font-medium font-mono text-xs">{campaign.start_date||'—'}</div></div>
              <div><span className="text-gray-500 text-xs">종료일</span><div className="font-medium font-mono text-xs">{campaign.end_date||'—'}</div></div>
              <div><span className="text-gray-500 text-xs">콘텐츠 유형</span><div className="font-medium">{campaign.content_type||'—'}</div></div>
              <div><span className="text-gray-500 text-xs">업로드일</span><div className="font-medium font-mono text-xs">{campaign.upload_date||'—'}</div></div>
              <div className="col-span-2"><span className="text-gray-500 text-xs">콘텐츠 주제</span><div className="font-medium">{campaign.content_topic||'—'}</div></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">📦 제품 정보</span>
              {product && <Link href={`/products/add?id=${product.id}`} className="btn-sm">제품 수정</Link>}
            </div>
            <div className="card-body">
              {product ? (
                <div className="flex gap-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100"/>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">📦</div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900">{product.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{product.category?.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-4 h-4 rounded border border-gray-200 flex-shrink-0" style={{background: brandColor}}/>
                      <span className="text-[10px] text-gray-500 font-mono">{brandColor}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">연결된 제품이 없어요</div>
              )}
            </div>
          </div>
        </div>

        {/* 🆕 장면 순서 지정 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🎬 장면 순서 지정 <span className="text-gray-400 font-normal text-[10px]">({enabledScenes}/{scenes.length}개 활성)</span></span>
            <button onClick={() => saveScenes(DEFAULT_SCENES)} className="btn-sm">기본값 복원</button>
          </div>
          <div className="card-body">
            <div className="text-[11px] text-red-600 mb-3">
              불필요한 장면은 체크 해제해 주세요. 화살표 버튼을 눌러 순서를 변경하실 수 있습니다.
            </div>
            <div className="space-y-2">
              {scenes.map((scene, i) => (
                <div key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${scene.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>

                  {/* 체크박스 */}
                  <input type="checkbox" checked={scene.enabled}
                    onChange={()=>toggleScene(i)}
                    className="mt-1.5 w-4 h-4 rounded border-gray-300 cursor-pointer"
                    style={{accentColor: brandColor}}/>

                  {/* 순서 + 화살표 */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded" style={{background: brandColor}}>순서 {i+1}</span>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={()=>moveScene(i, 'up')} disabled={i===0}
                        className="w-6 h-5 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 hover:bg-gray-100 rounded">▲</button>
                      <button onClick={()=>moveScene(i, 'down')} disabled={i===scenes.length-1}
                        className="w-6 h-5 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 hover:bg-gray-100 rounded">▼</button>
                    </div>
                  </div>

                  {/* 이미지 */}
                  <div className="flex-shrink-0">
                    {scene.image_url ? (
                      <img src={scene.image_url} alt="" className="w-16 h-12 rounded object-cover bg-gray-100"/>
                    ) : (
                      <div className="w-16 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">이미지</div>
                    )}
                    <input type="text" placeholder="이미지 URL"
                      value={scene.image_url}
                      onChange={e => updateSceneImage(i, e.target.value)}
                      onBlur={() => saveScenes(scenes)}
                      className="mt-1 w-16 text-[8px] px-1 py-0.5 border border-gray-200 rounded"/>
                  </div>

                  {/* 컨텐츠 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{scene.title}</span>
                      {scene.recommended && <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">권장</span>}
                    </div>
                    <input type="text"
                      value={scene.note}
                      onChange={e=>updateSceneNote(i, e.target.value)}
                      onBlur={()=>saveScenes(scenes)}
                      placeholder="입력 (선택사항)"
                      className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-[#1D9E75]"/>
                  </div>
                </div>
              ))}
            </div>

            {savingScenes && <div className="text-[10px] text-gray-400 text-right mt-2">저장 중...</div>}
          </div>
        </div>

        {/* 페르소나 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🙋 연결된 페르소나 ({personas.length}개)</span>
            <Link href={`/persona/add?campaign=${id}`} className="text-white text-xs font-semibold px-3 py-1 rounded-lg" style={{background: brandColor}}>+ 페르소나 추가</Link>
          </div>
          <div className="card-body">
            {personas.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <div className="text-3xl mb-2">🙋</div>
                연결된 페르소나가 없어요
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {personas.map(p => (
                  <Link key={p.id} href={`/persona/video?id=${p.id}`} className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{p.title || p.persona}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{p.persona}</div>
                        <div className="flex gap-1 mt-1.5">
                          <span className="chip chip-gray text-[10px]">{p.ctr}</span>
                          {p.script && <span className="chip chip-green text-[10px]">대본 ✓</span>}
                          {p.utm_url && <span className="chip chip-blue text-[10px]">UTM</span>}
                        </div>
                      </div>
                      <span className={`chip chip-green text-[10px] flex-shrink-0`}>{p.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
