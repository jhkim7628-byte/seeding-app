'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ProductPersonaSeed, PainCauseEmpathy, CauseSolutionEvidence } from '@/types/persona-script'

export default function SeedClient() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [productName, setProductName] = useState('')
  const [seed, setSeed] = useState<Partial<ProductPersonaSeed>>({
    target_description: '',
    purchase_reasons: [''],
    pain_cause_empathy: [{ pain: '', cause: '', empathy: '' }],
    cause_solution_evidence: [{ cause: '', solution: '', evidence: '' }],
    key_selling_points: [''],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [productId])

  async function load() {
    setLoading(true)
    try {
      // 제품 정보
      const productRes = await fetch(`/api/products/${productId}`)
      const product = await productRes.json()
      setProductName(product?.name || '제품')

      // 시드 데이터
      const seedRes = await fetch(`/api/product-seeds/${productId}`)
      const seedData = await seedRes.json()
      if (seedData && !seedData.error) {
        setSeed({
          target_description: seedData.target_description || '',
          purchase_reasons: seedData.purchase_reasons?.length ? seedData.purchase_reasons : [''],
          pain_cause_empathy: seedData.pain_cause_empathy?.length
            ? seedData.pain_cause_empathy
            : [{ pain: '', cause: '', empathy: '' }],
          cause_solution_evidence: seedData.cause_solution_evidence?.length
            ? seedData.cause_solution_evidence
            : [{ cause: '', solution: '', evidence: '' }],
          key_selling_points: seedData.key_selling_points?.length ? seedData.key_selling_points : [''],
        })
      }
    } catch (e) {
      console.error('Load error:', e)
    }
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    try {
      const cleanSeed = {
        product_id: productId,
        target_description: seed.target_description || '',
        purchase_reasons: (seed.purchase_reasons || []).filter((r) => r.trim()),
        pain_cause_empathy: (seed.pain_cause_empathy || []).filter((r) => r.pain.trim() || r.cause.trim()),
        cause_solution_evidence: (seed.cause_solution_evidence || []).filter((r) => r.cause.trim()),
        key_selling_points: (seed.key_selling_points || []).filter((r) => r.trim()),
      }
      await fetch(`/api/product-seeds/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanSeed),
      })
      alert('시드 데이터 저장 완료!')
    } catch (e) {
      alert('저장 실패: ' + (e as Error).message)
    }
    setSaving(false)
  }

  function updateReason(idx: number, value: string) {
    const arr = [...(seed.purchase_reasons || [])]
    arr[idx] = value
    setSeed({ ...seed, purchase_reasons: arr })
  }

  function addReason() {
    setSeed({ ...seed, purchase_reasons: [...(seed.purchase_reasons || []), ''] })
  }

  function removeReason(idx: number) {
    const arr = [...(seed.purchase_reasons || [])]
    arr.splice(idx, 1)
    setSeed({ ...seed, purchase_reasons: arr.length ? arr : [''] })
  }

  function updatePCE(idx: number, field: keyof PainCauseEmpathy, value: string) {
    const arr = [...(seed.pain_cause_empathy || [])]
    arr[idx] = { ...arr[idx], [field]: value }
    setSeed({ ...seed, pain_cause_empathy: arr })
  }

  function addPCE() {
    setSeed({
      ...seed,
      pain_cause_empathy: [...(seed.pain_cause_empathy || []), { pain: '', cause: '', empathy: '' }],
    })
  }

  function removePCE(idx: number) {
    const arr = [...(seed.pain_cause_empathy || [])]
    arr.splice(idx, 1)
    setSeed({ ...seed, pain_cause_empathy: arr.length ? arr : [{ pain: '', cause: '', empathy: '' }] })
  }

  function updateCSE(idx: number, field: keyof CauseSolutionEvidence, value: string) {
    const arr = [...(seed.cause_solution_evidence || [])]
    arr[idx] = { ...arr[idx], [field]: value }
    setSeed({ ...seed, cause_solution_evidence: arr })
  }

  function addCSE() {
    setSeed({
      ...seed,
      cause_solution_evidence: [
        ...(seed.cause_solution_evidence || []),
        { cause: '', solution: '', evidence: '' },
      ],
    })
  }

  function removeCSE(idx: number) {
    const arr = [...(seed.cause_solution_evidence || [])]
    arr.splice(idx, 1)
    setSeed({
      ...seed,
      cause_solution_evidence: arr.length ? arr : [{ cause: '', solution: '', evidence: '' }],
    })
  }

  function updateKSP(idx: number, value: string) {
    const arr = [...(seed.key_selling_points || [])]
    arr[idx] = value
    setSeed({ ...seed, key_selling_points: arr })
  }

  function addKSP() {
    setSeed({ ...seed, key_selling_points: [...(seed.key_selling_points || []), ''] })
  }

  function removeKSP(idx: number) {
    const arr = [...(seed.key_selling_points || [])]
    arr.splice(idx, 1)
    setSeed({ ...seed, key_selling_points: arr.length ? arr : [''] })
  }

  if (loading) {
    return <div className="p-7 text-center text-gray-400">불러오는 중...</div>
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href={`/products/${productId}`} className="text-gray-400 hover:text-gray-700">
            ←
          </Link>
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">{productName} · 페르소나 시드 데이터</h1>
            <div className="text-[11px] text-gray-500">한 번 세팅하면 페르소나 자동 생성에 자동 활용</div>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-[#1D9E75] text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50"
        >
          {saving ? '저장 중...' : '💾 시드 데이터 저장'}
        </button>
      </div>

      <div className="p-7 max-w-4xl">
        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-[12px] text-blue-900 leading-relaxed">
          💡 이 데이터는 <strong>페르소나 자동 생성</strong>에서 AI가 참고하는 자료입니다.<br />
          한 번 세팅하면 같은 제품의 페르소나를 만들 때마다 자동으로 불러와 사용해요.
        </div>

        {/* 1. 타깃 묘사 */}
        <div className="bg-white rounded-xl border border-gray-200 mb-4">
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="text-[13px] font-semibold text-gray-900">🎯 타깃 묘사</div>
            <div className="text-[10px] text-gray-500 mt-0.5">한 줄로 누가 이 제품을 살지 정의</div>
          </div>
          <div className="p-5">
            <input
              type="text"
              value={seed.target_description || ''}
              onChange={(e) => setSeed({ ...seed, target_description: e.target.value })}
              placeholder="예: 부모와 남편, 자녀가 있는 30~40대 여성"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
            />
          </div>
        </div>

        {/* 2. 구매 이유 */}
        <div className="bg-white rounded-xl border border-gray-200 mb-4">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-gray-900">💡 구매 이유</div>
              <div className="text-[10px] text-gray-500 mt-0.5">고객이 이 제품을 사는 핵심 이유들</div>
            </div>
            <button onClick={addReason} className="text-xs text-[#1D9E75] hover:underline">
              + 이유 추가
            </button>
          </div>
          <div className="p-5 space-y-2">
            {(seed.purchase_reasons || []).map((r, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 w-4">{idx + 1}.</span>
                <input
                  type="text"
                  value={r}
                  onChange={(e) => updateReason(idx, e.target.value)}
                  placeholder="예: 본인이나 가족이 고기 위주 식단"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                />
                <button
                  onClick={() => removeReason(idx)}
                  className="text-gray-400 hover:text-red-500 text-xs px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 고민 → 원인 → 공감 표 */}
        <div className="bg-white rounded-xl border border-gray-200 mb-4">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-gray-900">📊 고민 → 원인 → 공감 표</div>
              <div className="text-[10px] text-gray-500 mt-0.5">고객의 고통 구조 정리</div>
            </div>
            <button onClick={addPCE} className="text-xs text-[#1D9E75] hover:underline">
              + 행 추가
            </button>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 text-[10px] font-semibold text-gray-500 px-1">
                <div>고민</div>
                <div>원인</div>
                <div>공감 (실제 표현)</div>
                <div></div>
              </div>
              {(seed.pain_cause_empathy || []).map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2">
                  <input
                    type="text"
                    value={row.pain}
                    onChange={(e) => updatePCE(idx, 'pain', e.target.value)}
                    placeholder="건강해지고 싶어"
                    className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#1D9E75]"
                  />
                  <input
                    type="text"
                    value={row.cause}
                    onChange={(e) => updatePCE(idx, 'cause', e.target.value)}
                    placeholder="육식 위주 식습관"
                    className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#1D9E75]"
                  />
                  <input
                    type="text"
                    value={row.empathy}
                    onChange={(e) => updatePCE(idx, 'empathy', e.target.value)}
                    placeholder="뱃살, 방귀 냄새, 피부 트러블"
                    className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#1D9E75]"
                  />
                  <button
                    onClick={() => removePCE(idx)}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. 원인 → 솔루션 → 근거 표 */}
        <div className="bg-white rounded-xl border border-gray-200 mb-4">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-gray-900">⚙️ 원인 → 솔루션 → 근거 표</div>
              <div className="text-[10px] text-gray-500 mt-0.5">제품이 어떻게 해결하는지 정리</div>
            </div>
            <button onClick={addCSE} className="text-xs text-[#1D9E75] hover:underline">
              + 행 추가
            </button>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 text-[10px] font-semibold text-gray-500 px-1">
                <div>원인</div>
                <div>솔루션 (제품)</div>
                <div>근거 (성분·기능)</div>
                <div></div>
              </div>
              {(seed.cause_solution_evidence || []).map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2">
                  <input
                    type="text"
                    value={row.cause}
                    onChange={(e) => updateCSE(idx, 'cause', e.target.value)}
                    placeholder="육식 위주 식습관"
                    className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#1D9E75]"
                  />
                  <input
                    type="text"
                    value={row.solution}
                    onChange={(e) => updateCSE(idx, 'solution', e.target.value)}
                    placeholder="야채 섭취 증가"
                    className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#1D9E75]"
                  />
                  <input
                    type="text"
                    value={row.evidence}
                    onChange={(e) => updateCSE(idx, 'evidence', e.target.value)}
                    placeholder="8종 야채 섭취 가능"
                    className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#1D9E75]"
                  />
                  <button
                    onClick={() => removeCSE(idx)}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. 핵심 소구점 */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-gray-900">⭐ 핵심 소구점</div>
              <div className="text-[10px] text-gray-500 mt-0.5">대본·광고에 들어갈 핵심 메시지</div>
            </div>
            <button onClick={addKSP} className="text-xs text-[#1D9E75] hover:underline">
              + 추가
            </button>
          </div>
          <div className="p-5 space-y-2">
            {(seed.key_selling_points || []).map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 w-4">{idx + 1}.</span>
                <input
                  type="text"
                  value={p}
                  onChange={(e) => updateKSP(idx, e.target.value)}
                  placeholder="예: 두 알 = 야채 1.2kg"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                />
                <button
                  onClick={() => removeKSP(idx)}
                  className="text-gray-400 hover:text-red-500 text-xs px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 저장 */}
        <div className="flex justify-end gap-2">
          <Link
            href={`/products/${productId}`}
            className="bg-white border border-gray-200 text-gray-600 text-[13px] px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            취소
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="bg-[#1D9E75] text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50"
          >
            {saving ? '저장 중...' : '💾 시드 데이터 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
