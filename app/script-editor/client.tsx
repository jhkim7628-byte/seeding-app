'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CUT_TYPES, STAGE_COLORS } from '@/types/persona-script'
import type { ScriptCard, CutType, ScriptStage, ScriptCardImage } from '@/types/persona-script'

export default function ScriptEditorClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const personaId = searchParams.get('persona_id') || ''
  const sceneId = searchParams.get('scene_id') || ''
  const productId = searchParams.get('product_id') || ''
  const editScriptId = searchParams.get('id') || ''

  const [persona, setPersona] = useState<any>(null)
  const [scene, setScene] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [scriptId, setScriptId] = useState(editScriptId)

  const [title, setTitle] = useState('')
  const [cards, setCards] = useState<ScriptCard[]>([])
  const [editingCardId, setEditingCardId] = useState<string | null>(null)

  const [options, setOptions] = useState({
    duration_30_60: true,
    no_comment_cta: true,
    minimize_ad_feel: true,
    include_scene_description: true,
  })

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    setLoading(true)
    try {
      // 페르소나 정보
      if (personaId) {
        const r = await fetch(`/api/personas/${personaId}`)
        const data = await r.json()
        setPersona(data)
      }
      // 장면 정보
      if (sceneId) {
        const r = await fetch(`/api/scene-situations/${sceneId}`)
        const data = await r.json()
        setScene(data)
      }
      // 제품 정보
      if (productId) {
        const r = await fetch(`/api/products/${productId}`)
        const data = await r.json()
        setProduct(data)
      }

      // 기존 대본 편집인 경우
      if (editScriptId) {
        const r = await fetch(`/api/scripts-v4/${editScriptId}`)
        const data = await r.json()
        if (data && !data.error) {
          setTitle(data.title)
          setCards(data.cards || [])
          setOptions(data.options || options)
        }
      } else {
        // 새 대본: AI 자동 생성
        await generateScript()
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function generateScript() {
    setGenerating(true)
    try {
      const r = await fetch('/api/scripts-v4/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: personaId,
          scene_id: sceneId,
          product_id: productId,
          options,
        }),
      })
      const data = await r.json()
      if (data.title && data.cards) {
        setTitle(data.title)
        setCards(data.cards)
      }
    } catch (e) {
      alert('대본 생성 실패: ' + (e as Error).message)
    }
    setGenerating(false)
  }

  // 자동 저장 (디바운스)
  useEffect(() => {
    if (cards.length === 0 || !title) return
    const timer = setTimeout(async () => {
      await autoSave()
    }, 1500)
    return () => clearTimeout(timer)
  }, [cards, title])

  async function autoSave() {
    if (!persona) return
    try {
      const payload = {
        title,
        product_id: productId,
        persona_id: personaId,
        scene_situation_id: sceneId || null,
        ctr_type: persona?.ctr_type || '공감형',
        duration_seconds: 50,
        total_cuts: cards.filter((c) => !c.is_excluded).length,
        cards,
        options,
        status: 'draft',
      }
      if (scriptId) {
        await fetch(`/api/scripts-v4/${scriptId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        const r = await fetch('/api/scripts-v4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const saved = await r.json()
        if (saved.id) setScriptId(saved.id)
      }
      setAutoSaved(true)
      setTimeout(() => setAutoSaved(false), 2000)
    } catch (e) {
      console.error('Auto save error:', e)
    }
  }

  function updateCard(cardId: string, updates: Partial<ScriptCard>) {
    setCards(cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)))
  }

  function moveCardUp(cardId: string) {
    const idx = cards.findIndex((c) => c.id === cardId)
    if (idx <= 0) return
    const newCards = [...cards]
    ;[newCards[idx - 1], newCards[idx]] = [newCards[idx], newCards[idx - 1]]
    // order 재계산
    newCards.forEach((c, i) => (c.order = i + 1))
    setCards(newCards)
  }

  function moveCardDown(cardId: string) {
    const idx = cards.findIndex((c) => c.id === cardId)
    if (idx >= cards.length - 1) return
    const newCards = [...cards]
    ;[newCards[idx], newCards[idx + 1]] = [newCards[idx + 1], newCards[idx]]
    newCards.forEach((c, i) => (c.order = i + 1))
    setCards(newCards)
  }

  function toggleExclude(cardId: string) {
    updateCard(cardId, { is_excluded: !cards.find((c) => c.id === cardId)?.is_excluded })
  }

  async function handleImageUpload(cardId: string, files: FileList | null) {
    if (!files || files.length === 0) return
    setLoading(true)
    try {
      const newImages: ScriptCardImage[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('script_id', scriptId || 'temp')
        formData.append('card_id', cardId)

        const r = await fetch('/api/scripts-v4/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await r.json()
        if (data.url) {
          newImages.push({ id: `img_${Date.now()}_${i}`, url: data.url })
        }
      }

      const card = cards.find((c) => c.id === cardId)
      if (card) {
        updateCard(cardId, { images: [...(card.images || []), ...newImages] })
      }
    } catch (e) {
      alert('이미지 업로드 실패: ' + (e as Error).message)
    }
    setLoading(false)
  }

  function removeImage(cardId: string, imageId: string) {
    const card = cards.find((c) => c.id === cardId)
    if (card) {
      updateCard(cardId, { images: card.images.filter((img) => img.id !== imageId) })
    }
  }

  async function saveAndProceed() {
    await autoSave()
    if (scriptId) {
      router.push(`/script-editor/save-success?id=${scriptId}`)
    }
  }

  if (loading && cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-400">
        <div className="text-2xl mb-3">🤖</div>
        <div>{generating ? 'AI가 대본을 생성하고 있어요...' : '불러오는 중...'}</div>
      </div>
    )
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href={`/script-editor/scenes?persona_id=${personaId}&product_id=${productId}`}
            className="text-gray-400 hover:text-gray-700"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-bold text-gray-900">영상 기획 + AI 대본 생성</h1>
              <span className="bg-[#E1F5EE] text-[#0F6E56] text-[10px] px-2 py-0.5 rounded-full font-medium">
                {autoSaved ? '✓ 자동 저장됨' : '편집 모드 ✏️'}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {persona?.name} {scene?.title ? `· ${scene.emoji} ${scene.title}` : ''}
            </div>
          </div>
        </div>
        <button
          onClick={generateScript}
          disabled={generating}
          className="bg-[#1D9E75] text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50"
        >
          {generating ? 'AI 생성 중...' : '↻ 다시 생성'}
        </button>
      </div>

      {/* 본문: 좌측 정보 + 우측 카드 */}
      <div className="grid grid-cols-[200px_1fr] min-h-[calc(100vh-56px)]">
        {/* LEFT */}
        <div className="border-r border-gray-200 bg-[#F1EFE8] p-3">
          <div className="text-[10px] font-semibold text-[#0F6E56] mb-2 uppercase">📋 페르소나 정보</div>

          {persona && (
            <>
              <div className="bg-white rounded-md p-2.5 mb-2">
                <div className="text-[9px] text-gray-500 mb-0.5">페르소나명</div>
                <div className="text-[10px] font-medium text-gray-900 leading-relaxed">{persona.name}</div>
              </div>

              {scene && (
                <div className="bg-white rounded-md p-2.5 mb-2">
                  <div className="text-[9px] text-gray-500 mb-0.5">선택한 상황</div>
                  <div className="text-[10px] font-medium text-gray-900">
                    {scene.emoji} {scene.title}
                  </div>
                </div>
              )}

              {persona.matched_pains && persona.matched_pains.length > 0 && (
                <div className="bg-white rounded-md p-2.5 mb-2">
                  <div className="text-[9px] text-gray-500 mb-1">매핑된 고통</div>
                  <div className="flex flex-col gap-1">
                    {persona.matched_pains.map((p: any, idx: number) => {
                      const color =
                        p.intensity === 'very_strong'
                          ? 'bg-red-50 text-red-800'
                          : p.intensity === 'strong'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      return (
                        <span key={idx} className={`px-1.5 py-0.5 rounded text-[9px] ${color}`}>
                          {p.title}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-md p-2.5 mb-2">
                <div className="text-[9px] text-gray-500 mb-1">CTR 유형</div>
                <span className="bg-[#1D9E75] text-white px-2 py-0.5 rounded text-[10px] font-medium">
                  {persona.ctr_type || '공감형'}
                </span>
              </div>
            </>
          )}

          <div className="bg-white rounded-md p-2.5">
            <div className="text-[9px] text-gray-500 mb-1.5">생성 옵션</div>
            <div className="flex flex-col gap-1 text-[10px]">
              <label className="flex items-center gap-1 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.duration_30_60}
                  onChange={(e) => setOptions({ ...options, duration_30_60: e.target.checked })}
                  className="w-2.5 h-2.5"
                />{' '}
                영상 30~60초
              </label>
              <label className="flex items-center gap-1 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.no_comment_cta}
                  onChange={(e) => setOptions({ ...options, no_comment_cta: e.target.checked })}
                  className="w-2.5 h-2.5"
                />{' '}
                댓글 CTA 금지
              </label>
              <label className="flex items-center gap-1 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.minimize_ad_feel}
                  onChange={(e) => setOptions({ ...options, minimize_ad_feel: e.target.checked })}
                  className="w-2.5 h-2.5"
                />{' '}
                광고 티 최소화
              </label>
              <label className="flex items-center gap-1 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.include_scene_description}
                  onChange={(e) =>
                    setOptions({ ...options, include_scene_description: e.target.checked })
                  }
                  className="w-2.5 h-2.5"
                />{' '}
                장면 묘사 병기
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="p-5">
          {/* 영상 제목 */}
          <div className="mb-3">
            <div className="text-[10px] text-gray-500 mb-1 font-medium">영상 제목 (클릭 후 수정)</div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border-2 border-dashed border-[#1D9E75] rounded-md text-[13px] font-medium text-gray-900 focus:outline-none bg-white"
            />
          </div>

          {/* 카드 리스트 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-gray-500 font-medium">대본 본문</div>
              <div className="text-[10px] text-red-600">
                불필요한 장면은 체크 해제 / 화살표로 순서 변경 / 텍스트 클릭하면 즉시 수정
              </div>
            </div>

            <div className="space-y-2">
              {cards.map((card, idx) => {
                const stageColor = STAGE_COLORS[card.stage]
                const isEditing = editingCardId === card.id
                return (
                  <div
                    key={card.id}
                    className={`grid grid-cols-[24px_90px_1fr] gap-2 p-2.5 rounded-md transition ${
                      card.is_excluded
                        ? 'opacity-50 bg-gray-50 border border-gray-200'
                        : isEditing
                        ? 'border-2 border-[#1D9E75] bg-[#FAFFFB]'
                        : 'border border-gray-200 bg-white'
                    }`}
                  >
                    {/* 체크박스 */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={!card.is_excluded}
                        onChange={() => toggleExclude(card.id)}
                        className="w-3.5 h-3.5 accent-[#1D9E75]"
                      />
                    </div>

                    {/* 중앙: 순서 + 컷 종류 + 화살표 */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`px-2 py-0.5 rounded text-[9px] font-medium w-full text-center ${
                          card.is_excluded ? 'bg-gray-400 text-white' : 'bg-gray-900 text-white'
                        }`}
                      >
                        {card.is_excluded ? '제외됨' : `순서 ${idx + 1}`}
                      </div>
                      <select
                        value={card.cut_type}
                        onChange={(e) => updateCard(card.id, { cut_type: e.target.value as CutType })}
                        className="w-full text-[9px] px-1 py-0.5 border border-gray-200 rounded bg-white text-gray-700"
                      >
                        {CUT_TYPES.map((ct) => (
                          <option key={ct.value} value={ct.value}>
                            {ct.emoji} {ct.value.replace(' 컷', '')}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveCardUp(card.id)}
                          disabled={idx === 0}
                          className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[8px] text-gray-500 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveCardDown(card.id)}
                          disabled={idx === cards.length - 1}
                          className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[8px] text-gray-500 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    {/* 우측: 단계 + 본문 */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-medium text-white"
                          style={{ background: stageColor.bg }}
                        >
                          {card.stage}
                        </span>
                        {card.is_recommended && (
                          <span className="bg-gray-900 text-white px-1 py-0.5 rounded text-[8px] font-medium">
                            권장
                          </span>
                        )}
                        <span className="text-gray-500 text-[9px]">{card.time_label}</span>
                        <div className="flex-1"></div>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(card.id, e.target.files)}
                            className="hidden"
                          />
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] cursor-pointer ${
                              card.images?.length > 0
                                ? 'bg-[#1D9E75] text-white'
                                : 'border border-[#1D9E75] text-[#1D9E75]'
                            }`}
                          >
                            📷 {card.images?.length > 0 ? `✓ ${card.images.length}` : '+'}
                          </span>
                        </label>
                      </div>

                      {/* 본문 (편집 가능) */}
                      <div
                        contentEditable={!card.is_excluded}
                        suppressContentEditableWarning
                        onFocus={() => setEditingCardId(card.id)}
                        onBlur={(e) => {
                          updateCard(card.id, { content: e.currentTarget.innerHTML })
                          setEditingCardId(null)
                        }}
                        className={`px-2 py-1.5 text-[11px] leading-relaxed text-gray-900 rounded outline-none ${
                          isEditing
                            ? 'bg-white border border-dashed border-[#1D9E75]'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                        dangerouslySetInnerHTML={{ __html: card.content }}
                      />

                      {/* 이미지 첨부 */}
                      {card.images && card.images.length > 0 && (
                        <div className="flex gap-1 mt-2 p-1.5 bg-white rounded border border-gray-200">
                          {card.images.map((img) => (
                            <div key={img.id} className="relative">
                              <img
                                src={img.url}
                                alt={img.caption || ''}
                                className="w-12 h-9 object-cover rounded"
                              />
                              <button
                                onClick={() => removeImage(card.id, img.id)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 하단 액션 */}
          <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={generateScript}
              disabled={generating}
              className="bg-white border border-gray-200 text-gray-700 text-[11px] px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              ↻ AI 재생성
            </button>
            <button
              onClick={() => {
                const text = cards
                  .filter((c) => !c.is_excluded)
                  .map((c) => `[${c.stage}] ${c.content.replace(/<[^>]+>/g, '')}`)
                  .join('\n\n')
                navigator.clipboard.writeText(`${title}\n\n${text}`)
                alert('복사 완료!')
              }}
              className="bg-white border border-gray-200 text-gray-700 text-[11px] px-3 py-1.5 rounded hover:bg-gray-50"
            >
              📋 복사
            </button>
            <button
              onClick={() => window.open(`/api/scripts-v4/${scriptId}/pdf`, '_blank')}
              disabled={!scriptId}
              className="bg-white border border-gray-200 text-gray-700 text-[11px] px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              📄 PDF 다운
            </button>
            <div className="flex-1"></div>
            <button
              onClick={saveAndProceed}
              className="bg-[#1D9E75] text-white text-[11px] font-medium px-4 py-1.5 rounded hover:bg-[#0F6E56]"
            >
              💾 저장 + 캠페인 연결 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
