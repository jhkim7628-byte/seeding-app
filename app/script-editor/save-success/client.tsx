'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { CampaignSummary } from '@/types/persona-script'

type View = 'success' | 'campaign-select' | 'send-influencer' | 'completed'

export default function SaveSuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scriptId = searchParams.get('id') || ''

  const [view, setView] = useState<View>('success')
  const [script, setScript] = useState<any>(null)
  const [persona, setPersona] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [influencers, setInfluencers] = useState<any[]>([])
  const [selectedInfluencerIds, setSelectedInfluencerIds] = useState<string[]>([])
  const [sendMethod, setSendMethod] = useState<'pdf' | 'link' | 'text'>('pdf')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (scriptId) loadScript()
  }, [scriptId])

  async function loadScript() {
    try {
      const r = await fetch(`/api/scripts-v4/${scriptId}`)
      const data = await r.json()
      setScript(data)
      if (data.persona_id) {
        const r2 = await fetch(`/api/personas/${data.persona_id}`)
        const p = await r2.json()
        setPersona(p)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function loadCampaigns() {
    setLoading(true)
    try {
      const r = await fetch('/api/campaigns')
      const data = await r.json()
      // 페르소나 매칭 정보 추가
      const enriched: CampaignSummary[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status || 'preparing',
        status_label:
          c.status === 'active' ? '진행 중' : c.status === 'completed' ? '완료' : '준비 중',
        type: c.type || 'influencer',
        type_emoji: c.type === 'blog' ? '📝' : c.type === 'mixed' ? '🎬' : '🥬',
        total_count: c.total_count || 0,
        pending_count: c.pending_count || 0,
        days_left: c.days_left || 0,
        influencer_preview: c.influencer_preview || [],
        is_persona_match: false,
      }))
      setCampaigns(enriched)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function selectCampaignAndSend() {
    if (!selectedCampaignId) return alert('캠페인을 선택해주세요')

    setLoading(true)
    try {
      // 캠페인에 연결
      await fetch('/api/script-campaign-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: scriptId, campaign_id: selectedCampaignId }),
      })

      // 인플루언서 로드
      const r = await fetch(`/api/influencers?campaign_id=${selectedCampaignId}`)
      const data = await r.json()
      setInfluencers(data || [])
      setView('send-influencer')
    } catch (e) {
      alert('연결 실패: ' + (e as Error).message)
    }
    setLoading(false)
  }

  async function sendToInfluencers() {
    if (selectedInfluencerIds.length === 0) return alert('인플루언서를 선택해주세요')

    setLoading(true)
    try {
      await fetch('/api/script-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_id: scriptId,
          campaign_id: selectedCampaignId,
          influencer_ids: selectedInfluencerIds,
          send_method: sendMethod,
        }),
      })
      setView('completed')
    } catch (e) {
      alert('발송 실패: ' + (e as Error).message)
    }
    setLoading(false)
  }

  // 1. 저장 완료 화면
  if (view === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-7">
        <div className="bg-white rounded-xl border border-gray-200 max-w-2xl w-full overflow-hidden">
          <div className="bg-gradient-to-r from-[#1D9E75] to-[#0F6E56] px-6 py-6 text-center text-white">
            <div className="text-4xl mb-2">✓</div>
            <div className="text-base font-semibold mb-1">저장 완료!</div>
            <div className="text-xs opacity-90">대본이 라이브러리에 저장되었어요</div>
          </div>

          <div className="px-6 py-5 border-b border-gray-100">
            <div className="text-[10px] font-medium text-gray-500 mb-2 uppercase">📦 저장된 콘텐츠</div>
            <div className="bg-gray-50 rounded-lg p-3.5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-[#1D9E75] text-white px-2 py-0.5 rounded text-[10px] font-medium">
                  대본 #{script?.id?.slice(0, 8)}
                </span>
                <span className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px] text-gray-700">
                  {script?.ctr_type || '공감형'}
                </span>
              </div>
              <div className="text-[13px] font-medium text-gray-900 mb-1">{script?.title}</div>
              <div className="text-[11px] text-gray-500 leading-relaxed">
                페르소나: {persona?.name}<br />
                길이: {script?.duration_seconds || 50}초 · 컷:{' '}
                {script?.cards?.filter((c: any) => !c.is_excluded).length || 6}개
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="text-[10px] font-medium text-gray-500 mb-2.5 uppercase">🎯 다음 액션</div>

            <button
              onClick={() => {
                loadCampaigns()
                setView('campaign-select')
              }}
              className="w-full bg-white border-2 border-[#1D9E75] rounded-lg p-3.5 mb-2 text-left hover:bg-green-50 transition relative"
            >
              <div className="absolute top-2 right-3 bg-[#1D9E75] text-white px-2 py-0.5 rounded-full text-[9px] font-medium">
                추천
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#E1F5EE] w-10 h-10 rounded-lg flex items-center justify-center text-lg">
                  📢
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-900">캠페인에 연결하기</div>
                  <div className="text-[11px] text-gray-500">
                    진행 중인 캠페인에 추가 → 인플루언서에게 즉시 발송
                  </div>
                </div>
                <div className="text-[#1D9E75] text-lg">→</div>
              </div>
            </button>

            <button
              onClick={() => window.open(`/api/scripts-v4/${scriptId}/pdf`, '_blank')}
              className="w-full bg-white border border-gray-200 rounded-lg p-3.5 mb-2 text-left hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 w-10 h-10 rounded-lg flex items-center justify-center text-lg">
                  📄
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-900">PDF로 다운로드</div>
                  <div className="text-[11px] text-gray-500">
                    페르소나 + 대본 + 컷 가이드 + 이미지 포함
                  </div>
                </div>
                <div className="text-gray-400 text-lg">→</div>
              </div>
            </button>

            <Link
              href={`/persona-gen?product_id=${script?.product_id}`}
              className="w-full bg-white border border-gray-200 rounded-lg p-3.5 mb-2 text-left hover:bg-gray-50 transition flex items-center gap-3"
            >
              <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center text-lg">
                ✨
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-gray-900">새 페르소나로 다른 대본 만들기</div>
                <div className="text-[11px] text-gray-500">A/B 테스트용 변형 대본 생성</div>
              </div>
              <div className="text-gray-400 text-lg">→</div>
            </Link>

            <Link
              href="/script"
              className="w-full bg-white border border-gray-200 rounded-lg p-3.5 text-left hover:bg-gray-50 transition flex items-center gap-3"
            >
              <div className="bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center text-lg">
                📚
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-gray-900">대본 라이브러리로 이동</div>
                <div className="text-[11px] text-gray-500">저장된 모든 대본 보기</div>
              </div>
              <div className="text-gray-400 text-lg">→</div>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. 캠페인 선택 화면
  if (view === 'campaign-select') {
    const filtered = campaigns.filter(
      (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
      <div>
        <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center sticky top-0 z-20">
          <button onClick={() => setView('success')} className="text-gray-400 hover:text-gray-700 mr-3">
            ←
          </button>
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">캠페인에 대본 연결</h1>
            <div className="text-[11px] text-gray-500">{script?.title}</div>
          </div>
        </div>

        <div className="p-7 max-w-4xl">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
              <input
                type="text"
                placeholder="🔍 캠페인 이름 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>

            {/* 새 캠페인 만들기 */}
            <div className="p-5">
              <Link
                href={`/campaigns/add?script_id=${scriptId}`}
                className="block bg-gradient-to-r from-green-50 to-white border-2 border-dashed border-[#1D9E75] rounded-lg p-3 mb-3 hover:bg-green-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#1D9E75] text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                    +
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-medium text-gray-900">
                      새 캠페인 만들면서 이 대본 바로 사용
                    </div>
                    <div className="text-[10px] text-[#0F6E56]">
                      아직 캠페인이 없으면 여기서 새로 만들기
                    </div>
                  </div>
                </div>
              </Link>

              <div className="text-[10px] font-medium text-gray-500 mb-2 uppercase">
                📋 진행 가능한 캠페인 ({filtered.length}개)
              </div>

              {loading && filtered.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-xs">불러오는 중...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-xs">
                  진행 가능한 캠페인이 없어요. 새 캠페인을 만들어주세요.
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((c) => {
                    const isSelected = selectedCampaignId === c.id
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCampaignId(c.id)}
                        className={`bg-white border rounded-lg p-3 cursor-pointer relative ${
                          isSelected ? 'border-[#1D9E75] border-2' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-[#1D9E75] text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                            ✓
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="bg-[#E1F5EE] w-10 h-10 rounded-md flex items-center justify-center text-base">
                            {c.type_emoji}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-[13px] font-medium text-gray-900">{c.name}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                                  c.status === 'active'
                                    ? 'bg-amber-50 text-amber-800'
                                    : c.status === 'completed'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-blue-50 text-blue-800'
                                }`}
                              >
                                {c.status_label}
                              </span>
                              {c.is_persona_match && (
                                <span className="bg-red-50 text-red-800 px-1.5 py-0.5 rounded-full text-[9px] font-medium">
                                  ⭐ 페르소나 일치
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              인플루언서 {c.total_count}명
                              {c.days_left > 0 && ` · 마감 D-${c.days_left}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="text-[11px] text-gray-500">
                {selectedCampaignId
                  ? `✓ ${campaigns.find((c) => c.id === selectedCampaignId)?.name}`
                  : '캠페인을 선택하세요'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setView('success')}
                  className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs"
                >
                  취소
                </button>
                <button
                  onClick={selectCampaignAndSend}
                  disabled={!selectedCampaignId || loading}
                  className="bg-[#1D9E75] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50"
                >
                  {loading ? '연결 중...' : '🔗 캠페인에 연결'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 3. 인플루언서 발송 화면
  if (view === 'send-influencer') {
    return (
      <div>
        <div className="bg-green-50 border-b border-green-200 px-7 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#1D9E75] text-white w-5 h-5 rounded-full flex items-center justify-center text-[11px]">
              ✓
            </div>
            <div>
              <div className="text-[13px] font-medium text-gray-900">캠페인 연결 완료!</div>
              <div className="text-[10px] text-[#0F6E56]">
                "{campaigns.find((c) => c.id === selectedCampaignId)?.name}"에 대본이 추가되었어요
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-7 py-3">
          <h1 className="text-[14px] font-medium text-gray-900">이제 인플루언서에게 보낼까요?</h1>
          <div className="text-[11px] text-gray-500">
            발송 대기 {influencers.length}명 중 누구에게 보낼지 선택
          </div>
        </div>

        <div className="p-7 max-w-4xl">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4">
              {/* 일괄 선택 */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md mb-2.5">
                <input
                  type="checkbox"
                  checked={selectedInfluencerIds.length === influencers.length && influencers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInfluencerIds(influencers.map((i) => i.id))
                    } else {
                      setSelectedInfluencerIds([])
                    }
                  }}
                  className="w-3.5 h-3.5 accent-[#1D9E75]"
                />
                <span className="text-[11px] text-gray-700 flex-1">전체 선택 ({influencers.length}명)</span>
                <span className="text-[10px] text-[#1D9E75]">{selectedInfluencerIds.length}명 선택됨</span>
              </div>

              {influencers.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-xs">
                  이 캠페인에 등록된 인플루언서가 없어요.
                  <br />
                  <Link
                    href={`/campaigns/${selectedCampaignId}`}
                    className="text-[#1D9E75] hover:underline mt-2 inline-block"
                  >
                    인플루언서 추가하기 →
                  </Link>
                </div>
              ) : (
                influencers.map((inf) => {
                  const isSelected = selectedInfluencerIds.includes(inf.id)
                  return (
                    <div
                      key={inf.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md mb-1.5 cursor-pointer ${
                        isSelected ? 'border border-[#1D9E75] bg-green-50' : 'border border-gray-200'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedInfluencerIds(selectedInfluencerIds.filter((id) => id !== inf.id))
                        } else {
                          setSelectedInfluencerIds([...selectedInfluencerIds, inf.id])
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 accent-[#1D9E75]"
                      />
                      <div className="bg-gradient-to-br from-pink-200 to-pink-700 w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-medium">
                        {(inf.name || inf.username || '?')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-gray-900 truncate">
                          @{inf.username || inf.handle} · {inf.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          팔로워 {inf.followers_label || inf.followers || 0} · {inf.category || ''}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* 발송 옵션 */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="text-[10px] font-medium text-gray-500 mb-2">📤 발송 옵션</div>
              <div className="flex gap-1.5 mb-2">
                {(['pdf', 'link', 'text'] as const).map((m) => {
                  const labels = { pdf: '📄 PDF로 발송', link: '🔗 링크로 발송', text: '📋 텍스트로 발송' }
                  return (
                    <label
                      key={m}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] cursor-pointer ${
                        sendMethod === m
                          ? 'border border-[#1D9E75] bg-green-50 text-[#0F6E56]'
                          : 'border border-gray-200 text-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="send"
                        checked={sendMethod === m}
                        onChange={() => setSendMethod(m)}
                        className="accent-[#1D9E75]"
                      />
                      {labels[m]}
                    </label>
                  )
                })}
              </div>
              <div className="text-[10px] text-gray-500">
                💡 PDF에는 페르소나 정보, 대본, 컷별 가이드, 참고 이미지까지 포함
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
              <div className="text-[11px] text-gray-500">
                선택된 {selectedInfluencerIds.length}명에게 {sendMethod.toUpperCase()} 발송 예정
              </div>
              <div className="flex gap-1.5">
                <Link
                  href={`/campaigns/${selectedCampaignId}`}
                  className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md text-xs"
                >
                  나중에 발송
                </Link>
                <button
                  onClick={sendToInfluencers}
                  disabled={selectedInfluencerIds.length === 0 || loading}
                  className="bg-[#1D9E75] text-white text-xs font-medium px-4 py-1.5 rounded-md hover:bg-[#0F6E56] disabled:opacity-50"
                >
                  {loading ? '발송 중...' : `📤 ${selectedInfluencerIds.length}명에게 발송`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 4. 완료
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-7">
      <div className="bg-white rounded-xl border border-gray-200 max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <div className="text-lg font-semibold text-gray-900 mb-2">발송 완료!</div>
        <div className="text-xs text-gray-500 mb-6">
          {selectedInfluencerIds.length}명의 인플루언서에게 대본이 발송되었어요.
          <br />
          캠페인에서 진행 상황을 확인할 수 있어요.
        </div>
        <div className="flex gap-2 justify-center">
          <Link
            href={`/campaigns/${selectedCampaignId}`}
            className="bg-[#1D9E75] text-white text-xs font-medium px-4 py-2 rounded-lg"
          >
            캠페인 확인 →
          </Link>
          <Link
            href="/script"
            className="bg-white border border-gray-200 text-gray-700 text-xs px-4 py-2 rounded-lg"
          >
            대본 라이브러리
          </Link>
        </div>
      </div>
    </div>
  )
}
