'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Persona, Campaign } from '@/types'

const SC: Record<string,string> = {기획:'#A0AEC0',섭외:'#F59E0B',촬영:'#1D9E75',검수:'#3182CE',완료:'#7C3AED'}

export default function DashboardPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUtm, setEditingUtm] = useState<string|null>(null)
  const [utmDraft, setUtmDraft] = useState({utm_source:'', utm_medium:'', utm_campaign:'', utm_url:'', ga_clicks:0, ga_conversions:0})

  useEffect(() => {
    Promise.all([
      fetch('/api/personas').then(r=>r.json()),
      fetch('/api/campaigns').then(r=>r.json()),
    ]).then(([p,c]) => {
      setPersonas(Array.isArray(p)?p:[])
      setCampaigns(Array.isArray(c)?c:[])
      setLoading(false)
    })
  }, [])

  const scored = personas.filter(p=>p.score>0)
  const avgScore = scored.length ? Math.round(scored.reduce((a,p)=>a+p.score,0)/scored.length) : 0
  const totalClicks = personas.reduce((a,p) => a + (p.ga_clicks || 0), 0)
  const totalConversions = personas.reduce((a,p) => a + (p.ga_conversions || 0), 0)
  const avgCvr = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0'

  function openUtmEdit(p: Persona) {
    setEditingUtm(p.id || null)
    setUtmDraft({
      utm_source: p.utm_source || '',
      utm_medium: p.utm_medium || '',
      utm_campaign: p.utm_campaign || '',
      utm_url: p.utm_url || '',
      ga_clicks: p.ga_clicks || 0,
      ga_conversions: p.ga_conversions || 0,
    })
  }

  async function saveUtm() {
    if (!editingUtm) return
    await fetch(`/api/personas/${editingUtm}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(utmDraft),
    })
    const updated = await fetch('/api/personas').then(r=>r.json())
    setPersonas(updated)
    setEditingUtm(null)
  }

  function generateUtmUrl() {
    const baseUrl = prompt('기본 URL을 입력하세요 (예: https://shop.smartstore.com/yourbrand)')
    if (!baseUrl) return
    const url = `${baseUrl}?utm_source=${utmDraft.utm_source||'instagram'}&utm_medium=${utmDraft.utm_medium||'influencer'}&utm_campaign=${utmDraft.utm_campaign||'seeding'}`
    setUtmDraft({...utmDraft, utm_url: url})
  }

  // UTM 있는 페르소나만
  const trackedPersonas = personas.filter(p => p.utm_url)
  // 캠페인별 그룹화
  const byCampaign = campaigns.map(c => ({
    campaign: c,
    personas: personas.filter(p => p.campaign_id === c.id),
    clicks: personas.filter(p => p.campaign_id === c.id).reduce((a,p) => a + (p.ga_clicks || 0), 0),
    conversions: personas.filter(p => p.campaign_id === c.id).reduce((a,p) => a + (p.ga_conversions || 0), 0),
  })).filter(x => x.personas.length > 0).sort((a,b) => b.clicks - a.clicks)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">광고 성과 대시보드</h1>
          <span className="chip chip-green">UTM + GA 추적</span>
        </div>
      </div>
      <div className="p-7">
        {/* KPI */}
        <div className="grid grid-cols-5 gap-2.5 mb-5">
          {[
            {val:campaigns.filter(c => c.status==='활성').length, label:'활성 캠페인', c:'#1D9E75'},
            {val:trackedPersonas.length, label:'UTM 추적 중', c:'#3182CE'},
            {val:totalClicks.toLocaleString(), label:'총 클릭수', c:'#F59E0B'},
            {val:totalConversions.toLocaleString(), label:'총 전환수', c:'#7C3AED'},
            {val:avgCvr+'%', label:'평균 전환율', c:'#E53E3E'},
          ].map((k,i)=>(
            <div key={i} className="card relative overflow-hidden pt-1">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{background:k.c}}/>
              <div className="p-4">
                <div className="text-2xl font-black font-mono" style={{color:k.c}}>{k.val}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 캠페인별 성과 */}
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">📊 캠페인별 성과 순위</span></div>
          <div className="card-body p-0">
            {byCampaign.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">캠페인에 페르소나를 연결하면 여기에 성과가 표시돼요</div>
            ) : (
              <div className="bg-[#0D1117] grid text-[10px] text-gray-400 font-semibold uppercase tracking-wide" style={{gridTemplateColumns:'40px 1fr 90px 90px 90px 70px'}}>
                {['#','캠페인','페르소나','클릭','전환','CVR'].map(h => <div key={h} className="px-3 py-2">{h}</div>)}
              </div>
            )}
            {byCampaign.map((b, i) => {
              const cvr = b.clicks > 0 ? ((b.conversions / b.clicks) * 100).toFixed(1) : '0'
              return (
                <Link key={b.campaign.id} href={`/campaigns/${b.campaign.id}`} className="grid border-b border-gray-50 hover:bg-gray-50 items-center" style={{gridTemplateColumns:'40px 1fr 90px 90px 90px 70px'}}>
                  <div className="px-3 py-3 text-xs text-gray-400 font-bold">#{i+1}</div>
                  <div className="px-3 py-3 text-sm font-medium truncate">{b.campaign.name}</div>
                  <div className="px-3 py-3 text-xs">{b.personas.length}개</div>
                  <div className="px-3 py-3 text-xs font-mono font-bold">{b.clicks.toLocaleString()}</div>
                  <div className="px-3 py-3 text-xs font-mono font-bold text-[#1D9E75]">{b.conversions.toLocaleString()}</div>
                  <div className="px-3 py-3 text-xs font-mono font-bold" style={{color: parseFloat(cvr) >= 3 ? '#1D9E75' : parseFloat(cvr) >= 1 ? '#F59E0B' : '#A0AEC0'}}>{cvr}%</div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* 영상별 UTM 매칭 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔗 영상 ↔ UTM 매칭</span>
            <span className="text-[10px] text-gray-500">각 영상에 UTM 링크를 연결하면 GA에서 추적 가능해요</span>
          </div>
          <div className="card-body p-0">
            <div className="bg-[#0D1117] grid text-[10px] text-gray-400 font-semibold uppercase tracking-wide" style={{gridTemplateColumns:'1fr 130px 80px 80px 70px 70px'}}>
              {['영상 제목','UTM 링크','클릭','전환','CVR','관리'].map(h => <div key={h} className="px-3 py-2">{h}</div>)}
            </div>
            {personas.map(p => {
              const cvr = (p.ga_clicks || 0) > 0 ? (((p.ga_conversions || 0) / (p.ga_clicks || 1)) * 100).toFixed(1) : '0'
              return (
                <div key={p.id} className="grid border-b border-gray-50 hover:bg-gray-50 items-center" style={{gridTemplateColumns:'1fr 130px 80px 80px 70px 70px'}}>
                  <div className="px-3 py-2.5">
                    <div className="text-xs font-medium truncate">{p.title || '제목 미입력'}</div>
                    <div className="text-[10px] text-gray-400 truncate">{p.persona}</div>
                  </div>
                  <div className="px-3 py-2.5">
                    {p.utm_url ? (
                      <span className="text-[10px] text-blue-600 font-mono truncate block">{p.utm_url.substring(0, 25)}...</span>
                    ) : <span className="text-[10px] text-gray-400">미설정</span>}
                  </div>
                  <div className="px-3 py-2.5 text-xs font-mono">{(p.ga_clicks || 0).toLocaleString()}</div>
                  <div className="px-3 py-2.5 text-xs font-mono text-[#1D9E75]">{(p.ga_conversions || 0).toLocaleString()}</div>
                  <div className="px-3 py-2.5 text-xs font-mono">{cvr}%</div>
                  <div className="px-3 py-2.5">
                    <button onClick={() => openUtmEdit(p)} className="btn-sm text-[10px]">UTM 설정</button>
                  </div>
                </div>
              )
            })}
            {personas.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">페르소나를 추가하면 여기에 표시돼요</div>}
          </div>
        </div>
      </div>

      {/* UTM 편집 모달 */}
      {editingUtm && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center" onClick={()=>setEditingUtm(null)}>
          <div className="bg-white rounded-2xl w-[520px] shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold">🔗 UTM 매칭 설정</h3>
              <button onClick={()=>setEditingUtm(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">utm_source</label>
                  <input className="input" value={utmDraft.utm_source} onChange={e=>setUtmDraft({...utmDraft, utm_source: e.target.value})} placeholder="instagram"/>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">utm_medium</label>
                  <input className="input" value={utmDraft.utm_medium} onChange={e=>setUtmDraft({...utmDraft, utm_medium: e.target.value})} placeholder="influencer"/>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">utm_campaign</label>
                  <input className="input" value={utmDraft.utm_campaign} onChange={e=>setUtmDraft({...utmDraft, utm_campaign: e.target.value})} placeholder="seeding_5월"/>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-gray-600">최종 UTM URL</label>
                  <button onClick={generateUtmUrl} className="btn-sm text-[10px]">🔧 자동 생성</button>
                </div>
                <input className="input text-xs" value={utmDraft.utm_url} onChange={e=>setUtmDraft({...utmDraft, utm_url: e.target.value})} placeholder="https://shop.com/?utm_source=..."/>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">📊 클릭수 (GA)</label>
                  <input type="number" className="input" value={utmDraft.ga_clicks} onChange={e=>setUtmDraft({...utmDraft, ga_clicks: parseInt(e.target.value)||0})}/>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">📊 전환수 (GA)</label>
                  <input type="number" className="input" value={utmDraft.ga_conversions} onChange={e=>setUtmDraft({...utmDraft, ga_conversions: parseInt(e.target.value)||0})}/>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 bg-blue-50 p-2 rounded leading-relaxed">
                💡 GA에서 utm_campaign으로 필터링한 후 클릭수·전환수를 매주 수동 입력해주세요. 향후 GA API 자동 연동 추가 예정
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-2 justify-end">
              <button onClick={()=>setEditingUtm(null)} className="btn-ghost">취소</button>
              <button onClick={saveUtm} className="btn-primary">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
