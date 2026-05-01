'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { SceneSituation } from '@/types/persona-script'

export default function ScenesClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const personaId = searchParams.get('persona_id') || ''
  const productId = searchParams.get('product_id') || ''

  const [persona, setPersona] = useState<any>(null)
  const [scenes, setScenes] = useState<SceneSituation[]>([])
  const [selectedSceneId, setSelectedSceneId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (personaId) {
      loadPersona()
      generateScenes()
    }
  }, [personaId])

  async function loadPersona() {
    const res = await fetch(`/api/personas/${personaId}`)
    const data = await res.json()
    setPersona(data)
  }

  async function generateScenes() {
    if (!personaId) return
    setLoading(true)
    try {
      const res = await fetch('/api/persona-gen/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: personaId }),
      })
      const data = await res.json()
      if (data.scenes) {
        setScenes(data.scenes)
        // 추천 자동 선택
        const recommended = data.scenes.find((s: SceneSituation) => s.is_recommended)
        if (recommended) setSelectedSceneId(recommended.id)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function proceedToScript() {
    if (!selectedSceneId) {
      alert('장면 상황을 선택해주세요')
      return
    }
    setLoading(true)
    try {
      // 선택된 장면 저장
      const selectedScene = scenes.find((s) => s.id === selectedSceneId)
      const res = await fetch('/api/scene-situations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: personaId,
          ...selectedScene,
          is_selected: true,
        }),
      })
      const saved = await res.json()
      // 대본 편집기로 이동
      router.push(
        `/script-editor?persona_id=${personaId}&scene_id=${saved.id}&product_id=${productId}`
      )
    } catch (e) {
      alert('오류: ' + (e as Error).message)
    }
    setLoading(false)
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href={`/persona-gen?product_id=${productId}`} className="text-gray-400 hover:text-gray-700">
            ←
          </Link>
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">대본 생성 전 · 장면 상황 선택</h1>
            <div className="text-[11px] text-gray-500">
              {persona?.name || '페르소나'} · 영상의 시작점을 정해주세요
            </div>
          </div>
        </div>
      </div>

      <div className="p-7 max-w-4xl">
        {persona && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-[11px] text-green-900 leading-relaxed">
            💡 <strong>페르소나:</strong> {persona.name}
            <br />
            <strong>고통:</strong>{' '}
            {persona.matched_pains?.map((p: any) => p.title).join(' · ') || persona.pain}
          </div>
        )}

        {loading && scenes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            🤖 AI가 장면 상황을 분석 중...
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="text-[13px] font-semibold text-gray-900">📍 장면 상황 후보 (1개 선택)</div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                대본의 시작점이 될 일상 장면. 영상의 분위기를 결정해요.
              </div>
            </div>
            <div className="p-5 space-y-2">
              {scenes.map((s, idx) => {
                const isSelected = selectedSceneId === s.id
                const rankColor =
                  idx === 0
                    ? 'bg-[#1D9E75] text-white'
                    : idx <= 2
                    ? 'bg-blue-200 text-blue-900'
                    : 'bg-gray-200 text-gray-700'
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSceneId(s.id)}
                    className={`bg-white border rounded-lg p-3 cursor-pointer ${
                      isSelected ? 'border-[#1D9E75] border-2' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${rankColor}`}>
                        상황 {idx + 1}
                        {idx === 0 ? ' · 추천' : ''}
                      </span>
                    </div>
                    <div className="text-[13px] font-medium text-gray-900 mb-1">
                      {s.emoji} {s.title}
                    </div>
                    <div className="text-[12px] text-gray-700 leading-relaxed mb-2">{s.description}</div>
                    {s.reasoning && (
                      <div className="text-[10px] text-green-800 leading-relaxed">📌 {s.reasoning}</div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between">
              <button
                onClick={generateScenes}
                disabled={loading}
                className="bg-white border border-gray-200 text-gray-600 text-[13px] px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                ↻ 다시 생성
              </button>
              <button
                onClick={proceedToScript}
                disabled={!selectedSceneId || loading}
                className="bg-[#1D9E75] text-white text-[13px] font-medium px-5 py-2 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50"
              >
                {loading ? '진행 중...' : '선택한 상황으로 대본 생성 →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
