'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type {
  PersonaCandidate,
  PainCandidate,
  GeneratedPersona,
  ProductPersonaSeed,
} from '@/types/persona-script'

type Step = 1 | 2 | 3 | 4

export default function PersonaGenClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productIdFromUrl = searchParams.get('product_id') || ''

  const [step, setStep] = useState<Step>(1)
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [productId, setProductId] = useState(productIdFromUrl)
  const [seed, setSeed] = useState<ProductPersonaSeed | null>(null)

  const [candidates, setCandidates] = useState<PersonaCandidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<PersonaCandidate | null>(null)

  const [pains, setPains] = useState<PainCandidate[]>([])
  const [selectedPainIds, setSelectedPainIds] = useState<string[]>([])

  const [generated, setGenerated] = useState<GeneratedPersona | null>(null)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // C1: Who 칩 편집용 state
  const [editingWhoIdx, setEditingWhoIdx] = useState<number | null>(null)
  const [newWhoFact, setNewWhoFact] = useState('')
  const [showNewWhoInput, setShowNewWhoInput] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (productId) loadSeed(productId)
  }, [productId])

  async function loadProducts() {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(Array.isArray(data) ? data : [])
  }

  async function loadSeed(pid: string) {
    const res = await fetch(`/api/product-seeds/${pid}`)
    const data = await res.json()
    if (data && !data.error && data.target_description) {
      setSeed(data)
    } else {
      setSeed(null)
    }
  }

  // STEP 2로 이동: 페르소나 후보 10개 생성
  async function generateCandidates() {
    if (!seed) {
      alert('먼저 제품 시드 데이터를 세팅해주세요!\n상품 관리 → 제품 선택 → 페르소나 시드 데이터')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/persona-gen/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, seed }),
      })
      const data = await res.json()
      if (data.candidates) {
        setCandidates(data.candidates)
        setStep(2)
      } else {
        alert('생성 실패: ' + (data.error || '알 수 없는 오류'))
      }
    } catch (e) {
      alert('오류: ' + (e as Error).message)
    }
    setLoading(false)
  }

  // STEP 3으로 이동: 고통 후보 생성
  async function generatePains() {
    if (!selectedCandidate) {
      alert('페르소나를 선택해주세요')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/persona-gen/pains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, seed, candidate: selectedCandidate }),
      })
      const data = await res.json()
      if (data.pains) {
        setPains(data.pains)
        const autoSelected = data.pains
          .filter((p: PainCandidate) => p.intensity === 'very_strong' || p.intensity === 'strong')
          .map((p: PainCandidate) => p.id)
        setSelectedPainIds(autoSelected)
        setStep(3)
      } else {
        alert('생성 실패: ' + (data.error || '알 수 없는 오류'))
      }
    } catch (e) {
      alert('오류: ' + (e as Error).message)
    }
    setLoading(false)
  }

  // STEP 4로 이동: 페르소나 자동 채우기
  async function generateFullPersona() {
    if (selectedPainIds.length === 0) {
      alert('1개 이상의 고통을 선택해주세요')
      return
    }
    setLoading(true)
    try {
      const selectedPains = pains.filter((p) => selectedPainIds.includes(p.id))
      const res = await fetch('/api/persona-gen/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          seed,
          candidate: selectedCandidate,
          pains: selectedPains,
        }),
      })
      const data = await res.json()
      if (data.persona) {
        setGenerated(data.persona)
        setStep(4)
      } else {
        alert('생성 실패: ' + (data.error || '알 수 없는 오류'))
      }
    } catch (e) {
      alert('오류: ' + (e as Error).message)
    }
    setLoading(false)
  }

  // 저장 후 장면 상황 단계로
  async function saveAndNext() {
    if (!generated) return
    setLoading(true)
    try {
      const selectedPains = pains.filter((p) => selectedPainIds.includes(p.id))
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: generated.name,
          who: generated.who,
          pain: generated.pain,
          pain_scene: generated.pain_scene,
          decision_d1: generated.decisions.d1,
          decision_d2: generated.decisions.d2,
          decision_d3: generated.decisions.d3,
          scenario_s1: generated.scenarios.s1,
          scenario_s2: generated.scenarios.s2,
          scenario_s3: generated.scenarios.s3,
          ctr_type: generated.ctr_type,
          tags: generated.tags,
          product_id: productId,
          generated_by_ai: true,
          matched_pains: selectedPains,
          conversion_score: selectedCandidate?.conversion_score || 0,
        }),
      })
      const persona = await res.json()
      if (persona.id) {
        router.push(`/script-editor/scenes?persona_id=${persona.id}&product_id=${productId}`)
      }
    } catch (e) {
      alert('저장 실패: ' + (e as Error).message)
    }
    setLoading(false)
  }

  // C1 Who 헬퍼: 마침표 기준으로 항목 분리
  const whoFacts = generated
    ? generated.who.split(/[.。]/).map((s) => s.trim()).filter(Boolean)
    : []

  function joinWho(facts: string[]) {
    return facts.length > 0 ? facts.join('. ') + '.' : ''
  }

  function updateWhoFact(idx: number, newValue: string) {
    if (!generated) return
    const trimmed = newValue.trim()
    if (!trimmed) {
      removeWhoFact(idx)
      return
    }
    const newFacts = [...whoFacts]
    newFacts[idx] = trimmed
    setGenerated({ ...generated, who: joinWho(newFacts) })
  }

  function removeWhoFact(idx: number) {
    if (!generated) return
    const newFacts = whoFacts.filter((_, i) => i !== idx)
    setGenerated({ ...generated, who: joinWho(newFacts) })
  }

  function commitNewWhoFact() {
    if (!generated) return
    const trimmed = newWhoFact.trim()
    if (trimmed) {
      const newFacts = [...whoFacts, trimmed]
      setGenerated({ ...generated, who: joinWho(newFacts) })
    }
    setNewWhoFact('')
    setShowNewWhoInput(false)
  }

  const stepLabels = ['제품 선택', '페르소나명', '핵심 고통', '결과 확인']

  return (
    <div>
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">✨ 페르소나 자동 생성</h1>
          <span className="bg-[#E1F5EE] text-[#0F6E56] text-[10px] px-2 py-0.5 rounded-full font-medium">
            AI 기반
          </span>
        </div>
      </div>

      {/* 진행 단계 표시 */}
      <div className="bg-white border-b border-gray-200 px-7 py-3">
        <div className="flex items-center gap-2 max-w-3xl">
          {stepLabels.map((label, idx) => {
            const stepNum = (idx + 1) as Step
            const isActive = step === stepNum
            const isPast = step > stepNum
            return (
              <div key={idx} className="flex items-center flex-1">
                <div
                  className={`flex items-center gap-2 ${
                    isActive ? 'text-[#1D9E75]' : isPast ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium ${
                      isActive
                        ? 'bg-[#1D9E75] text-white'
                        : isPast
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isPast ? '✓' : stepNum}
                  </div>
                  <span className="text-[12px] font-medium whitespace-nowrap">{label}</span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-px mx-2 ${isPast ? 'bg-gray-700' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-7 max-w-4xl">
        {/* STEP 1: 제품 선택 */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="text-[13px] font-semibold text-gray-900">STEP 1. 제품 선택</div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                페르소나를 만들 제품을 선택하세요. 시드 데이터가 자동으로 불러와져요.
              </div>
            </div>
            <div className="p-5">
              <div className="text-[11px] font-medium text-gray-700 mb-2">제품</div>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">제품을 선택하세요</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {productId && seed && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-[11px] font-semibold text-green-800 mb-2">
                    ✓ 시드 데이터 자동 로드됨
                  </div>
                  <div className="text-[11px] text-green-900 space-y-1">
                    <div><strong>타깃:</strong> {seed.target_description}</div>
                    <div><strong>구매 이유:</strong> {seed.purchase_reasons.length}개</div>
                    <div><strong>고통 매핑:</strong> {seed.pain_cause_empathy.length}개 행</div>
                    <div><strong>핵심 소구점:</strong> {seed.key_selling_points.length}개</div>
                  </div>
                </div>
              )}

              {productId && !seed && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-[11px] text-yellow-800">
                    ⚠️ 이 제품에는 시드 데이터가 없어요. 먼저 시드 데이터를 세팅해주세요.
                    <Link
                      href={`/products/${productId}/seed`}
                      className="text-[#1D9E75] hover:underline ml-1 font-medium"
                    >
                      시드 데이터 세팅 →
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={generateCandidates}
                  disabled={!productId || !seed || loading}
                  className="bg-[#1D9E75] text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50"
                >
                  {loading ? '생성 중...' : '✨ 페르소나명 후보 생성 →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: 페르소나명 후보 10개 */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="text-[13px] font-semibold text-gray-900">
                STEP 2. 페르소나명 후보 (전환율 높은 순)
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                고통 강도 × 제품 소구점 매칭도 = 전환 확률 · 1개 선택
              </div>
            </div>
            <div className="p-5 space-y-2 max-h-[600px] overflow-y-auto">
              {candidates.map((c) => {
                const isSelected = selectedCandidate?.rank === c.rank
                const rankColor =
                  c.rank <= 2
                    ? 'bg-[#1D9E75] text-white'
                    : c.rank <= 5
                    ? 'bg-blue-200 text-blue-900'
                    : 'bg-gray-200 text-gray-700'
                return (
                  <div
                    key={c.rank}
                    onClick={() => setSelectedCandidate(c)}
                    className={`bg-white border rounded-lg p-3 cursor-pointer ${
                      isSelected ? 'border-[#1D9E75] border-2' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${rankColor}`}>
                        {c.rank}위 · 전환율 {c.conversion_score}%
                      </span>
                      <span className="bg-red-50 text-red-800 px-1.5 py-0.5 rounded-full text-[9px]">
                        {c.pain_intensity_label}
                      </span>
                      <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-full text-[9px]">
                        소구점 {c.selling_point_match}
                      </span>
                    </div>
                    <div className="text-[13px] font-medium text-gray-900 mb-1">{c.name}</div>
                    <div className="text-[10px] text-gray-500 leading-relaxed">📌 {c.reasoning}</div>
                  </div>
                )
              })}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-white border border-gray-200 text-gray-600 text-[13px] px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                ← 이전
              </button>
              <div className="flex gap-2">
                <button
                  onClick={generateCandidates}
                  disabled={loading}
                  className="bg-white border border-gray-200 text-gray-600 text-[13px] px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  ↻ 다시 생성
                </button>
                <button
                  onClick={generatePains}
                  disabled={!selectedCandidate || loading}
                  className="bg-[#1D9E75] text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50"
                >
                  {loading ? '진행 중...' : '선택한 페르소나로 →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: 핵심 고통 매핑 */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="text-[13px] font-semibold text-gray-900">STEP 3. 핵심 고통 매핑</div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                선택한 페르소나가 가장 공감할 고통 · 1~3개 선택 (복수 가능)
              </div>
            </div>
            <div className="p-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-4 text-[11px] text-blue-900">
                선택된 페르소나: <strong>{selectedCandidate?.name}</strong>
              </div>

              <div className="space-y-2">
                {pains.map((p) => {
                  const isSelected = selectedPainIds.includes(p.id)
                  const intensityColor =
                    p.intensity === 'very_strong'
                      ? 'bg-red-50 text-red-800'
                      : p.intensity === 'strong'
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-gray-100 text-gray-700'
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPainIds(selectedPainIds.filter((id) => id !== p.id))
                        } else if (selectedPainIds.length < 3) {
                          setSelectedPainIds([...selectedPainIds, p.id])
                        } else {
                          alert('최대 3개까지 선택 가능합니다')
                        }
                      }}
                      className={`bg-white border rounded-lg p-3 cursor-pointer relative ${
                        isSelected ? 'border-[#1D9E75] border-2' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[#1D9E75] text-white w-4 h-4 rounded flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-medium text-gray-900">{p.title}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${intensityColor}`}>
                          {p.intensity_label}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500">근거: {p.reasoning}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="bg-white border border-gray-200 text-gray-600 text-[13px] px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                ← 이전
              </button>
              <div className="flex gap-2">
                <button
                  onClick={generatePains}
                  disabled={loading}
                  className="bg-white border border-gray-200 text-gray-600 text-[13px] px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  ↻ 다시 생성
                </button>
                <button
                  onClick={generateFullPersona}
                  disabled={selectedPainIds.length === 0 || loading}
                  className="bg-[#1D9E75] text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50"
                >
                  {loading ? '생성 중...' : '자동 입력 →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: 자동 채워진 결과 */}
        {step === 4 && generated && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-gray-900">STEP 4. 자동 입력 결과</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  필요하면 직접 수정 가능 · 마음에 들면 저장
                </div>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-[11px] text-[#1D9E75] hover:underline"
              >
                {editMode ? '✓ 미리보기' : '📝 수정 모드'}
              </button>
            </div>
            <div className="p-5 space-y-3">
              {/* 페르소나명 */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">페르소나명</div>
                {editMode ? (
                  <input
                    type="text"
                    value={generated.name}
                    onChange={(e) => setGenerated({ ...generated, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#1D9E75] rounded-lg text-sm bg-green-50 focus:outline-none"
                  />
                ) : (
                  <div className="bg-green-50 border border-[#1D9E75] rounded-lg p-2.5 text-[13px] font-medium text-gray-900">
                    {generated.name}
                  </div>
                )}
              </div>

              {/* C1: 누구 (Who) - 칩 카드 형태 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-medium text-gray-500">
                    누구 (Who) <span className="text-gray-400">· {whoFacts.length}개 항목</span>
                  </div>
                  <span className="text-[9px] text-gray-400">
                    클릭하면 수정 · ×로 삭제 · Enter로 저장
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex flex-wrap gap-1.5">
                    {whoFacts.map((fact, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50 border border-blue-200 rounded-md flex items-center hover:border-blue-400 transition-colors"
                      >
                        {editingWhoIdx === idx ? (
                          <input
                            type="text"
                            defaultValue={fact}
                            autoFocus
                            onBlur={(e) => {
                              updateWhoFact(idx, e.target.value)
                              setEditingWhoIdx(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateWhoFact(idx, e.currentTarget.value)
                                setEditingWhoIdx(null)
                              }
                              if (e.key === 'Escape') setEditingWhoIdx(null)
                            }}
                            className="text-[11px] bg-white border border-blue-400 rounded px-2 py-1 outline-none min-w-[200px]"
                          />
                        ) : (
                          <>
                            <span
                              onClick={() => setEditingWhoIdx(idx)}
                              className="text-[11px] text-gray-800 cursor-text px-2.5 py-1 select-none"
                            >
                              {fact}
                            </span>
                            <button
                              onClick={() => removeWhoFact(idx)}
                              className="text-blue-300 hover:text-red-500 text-[14px] leading-none px-1.5 py-1 border-l border-blue-200"
                              title="삭제"
                            >
                              ×
                            </button>
                          </>
                        )}
                      </div>
                    ))}

                    {showNewWhoInput ? (
                      <input
                        type="text"
                        value={newWhoFact}
                        onChange={(e) => setNewWhoFact(e.target.value)}
                        onBlur={commitNewWhoFact}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitNewWhoFact()
                          if (e.key === 'Escape') {
                            setNewWhoFact('')
                            setShowNewWhoInput(false)
                          }
                        }}
                        autoFocus
                        placeholder="예: 결혼 12년차, 자녀 2명"
                        className="text-[11px] bg-white border border-[#1D9E75] rounded px-2 py-1 outline-none min-w-[200px]"
                      />
                    ) : (
                      <button
                        onClick={() => setShowNewWhoInput(true)}
                        className="border border-dashed border-gray-300 px-2.5 py-1 rounded-md text-[11px] text-gray-500 hover:border-[#1D9E75] hover:text-[#1D9E75]"
                      >
                        + 항목 추가
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 핵심 고통 */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">핵심 고통</div>
                {editMode ? (
                  <textarea
                    value={generated.pain}
                    onChange={(e) => setGenerated({ ...generated, pain: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  />
                ) : (
                  <div className="border border-gray-200 rounded-lg p-2.5 text-[12px] text-gray-700 leading-relaxed">
                    {generated.pain}
                  </div>
                )}
              </div>

              {/* 고통 장면 */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">고통 장면</div>
                {editMode ? (
                  <textarea
                    value={generated.pain_scene}
                    onChange={(e) => setGenerated({ ...generated, pain_scene: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  />
                ) : (
                  <div className="border border-gray-200 rounded-lg p-2.5 text-[12px] text-gray-700 leading-relaxed">
                    {generated.pain_scene}
                  </div>
                )}
              </div>

              {/* 구매 결정 3순간 */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">구매 결정 3순간</div>
                <div className="space-y-1.5">
                  {(['d1', 'd2', 'd3'] as const).map((key, idx) => (
                    <div
                      key={key}
                      className="border border-gray-200 rounded-lg p-2 text-[11px] flex gap-2 items-start"
                    >
                      <span className="text-[#1D9E75] font-medium whitespace-nowrap">
                        D{idx + 1}{' '}
                        {idx === 0 ? '나 얘기네:' : idx === 1 ? '진짜 되나:' : '나도 가능:'}
                      </span>
                      {editMode ? (
                        <input
                          value={generated.decisions[key]}
                          onChange={(e) =>
                            setGenerated({
                              ...generated,
                              decisions: { ...generated.decisions, [key]: e.target.value },
                            })
                          }
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-[11px]"
                        />
                      ) : (
                        <span className="text-gray-700">{generated.decisions[key]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 영상 기획 3줄 */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">영상 기획 3줄</div>
                <div className="space-y-1.5">
                  {(['s1', 's2', 's3'] as const).map((key, idx) => {
                    const labels = ['S1 지금 상태:', 'S2 보고 나서:', 'S3 핵심 장면:']
                    return (
                      <div
                        key={key}
                        className="border border-gray-200 rounded-lg p-2 text-[11px] flex gap-2 items-start"
                      >
                        <span className="text-[#1D9E75] font-medium whitespace-nowrap">
                          {labels[idx]}
                        </span>
                        {editMode ? (
                          <input
                            value={generated.scenarios[key]}
                            onChange={(e) =>
                              setGenerated({
                                ...generated,
                                scenarios: { ...generated.scenarios, [key]: e.target.value },
                              })
                            }
                            className="flex-1 px-2 py-1 border border-gray-200 rounded text-[11px]"
                          />
                        ) : (
                          <span className="text-gray-700">{generated.scenarios[key]}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 추천 CTR */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">추천 CTR 유형</div>
                <div className="bg-[#E1F5EE] text-[#0F6E56] px-3 py-1.5 rounded-full text-[12px] font-medium inline-block">
                  {generated.ctr_type} (매칭도 {generated.ctr_match_score}%)
                </div>
              </div>

              {/* 태그 */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">태그</div>
                <div className="flex flex-wrap gap-1">
                  {generated.tags.map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="bg-white border border-gray-200 text-gray-600 text-[13px] px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                ← 이전
              </button>
              <button
                onClick={saveAndNext}
                disabled={loading}
                className="bg-[#1D9E75] text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50"
              >
                {loading ? '저장 중...' : '💾 저장 + 장면 상황 선택 →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
