'use client'
import { useEffect, useState } from 'react'
import { Influencer } from '@/types'

const EMPTY: Omit<Influencer,'id'> = { name:'',handle:'',platform:'인스타그램',followers:'',engage:'',tone:'',persona:'',fit:0,risk:'없음',campaigns:0,color:'#1D9E75' }
const COLORS = ['#1D9E75','#3182CE','#7C3AED','#F59E0B','#E53E3E','#0D9488','#9333EA','#0369A1']

export default function InfluencerPage() {
  const [list, setList] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add'|'edit'|null>(null)
  const [form, setForm] = useState({...EMPTY})
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch('/api/influencers').then(r=>r.json()).then(d=>{ setList(Array.isArray(d)?d:[]); setLoading(false) }) }, [])

  const set = (k:string,v:unknown) => setForm(f=>({...f,[k]:v}))

  function openAdd() { setForm({...EMPTY, color:COLORS[list.length%COLORS.length]}); setEditId(null); setModal('add') }
  function openEdit(inf:Influencer) { setForm({...inf}); setEditId(inf.id||null); setModal('edit') }

  async function save() {
    if (!form.name) { alert('이름을 입력해주세요'); return }
    setSaving(true)
    if (editId) {
      await fetch(`/api/influencers/${editId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    } else {
      await fetch('/api/influencers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    }
    setSaving(false); setModal(null)
    const res = await fetch('/api/influencers'); setList(await res.json())
  }

  async function del(id:string) {
    if (!confirm('삭제할까요?')) return
    await fetch(`/api/influencers/${id}`,{method:'DELETE'})
    setList(list.filter(i=>i.id!==id))
  }

  const fc = (f:number) => f>=85?'#1D9E75':f>=70?'#F59E0B':'#E53E3E'

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">인플루언서 풀</h1>
          <span className="chip chip-green">{list.length}명 등록</span>
        </div>
        <button onClick={openAdd} className="btn-primary">+ 추가</button>
      </div>
      <div className="p-7">
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {[
            {val:list.length,label:'전체',color:'#1D9E75',bc:'chip-green'},
            {val:list.filter(i=>i.campaigns>0).length,label:'진행 중',color:'#3182CE',bc:'chip-blue'},
            {val:list.length?((list.reduce((a,i)=>a+parseFloat(i.engage||'0'),0)/list.length).toFixed(1)+'%'):'—',label:'평균 참여율',color:'#F59E0B',bc:'chip-amber'},
            {val:list.filter(i=>i.risk==='중간'||i.risk==='높음').length,label:'리스크',color:'#7C3AED',bc:'chip-purple'},
          ].map((k,i)=>(
            <div key={i} className="card relative overflow-hidden pt-1">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{background:k.color}}/>
              <div className="p-4">
                <div className="text-2xl font-black font-mono" style={{color:k.color}}>{k.val}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{k.label}</div>
                <span className={`chip ${k.bc} mt-1.5`}>등록됨</span>
              </div>
            </div>
          ))}
        </div>

        {loading ? <div className="text-center py-10 text-gray-400">불러오는 중...</div> : (
          <div className="grid grid-cols-3 gap-3.5">
            {list.map(inf => (
              <div key={inf.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4" style={{background:'linear-gradient(135deg,#0D1117,#1C2333)'}}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white mb-2.5 border-2 border-white/20" style={{background:inf.color}}>{inf.name[0]}</div>
                  <div className="text-sm font-bold text-white">{inf.name}</div>
                  <div className="text-[11px] text-gray-400">{inf.handle} · {inf.platform}</div>
                </div>
                <div className="p-4 space-y-2">
                  {[['팔로워',inf.followers],['참여율',inf.engage],['채널 톤',inf.tone],['매칭 페르소나',inf.persona],['리스크',inf.risk],['진행 캠페인',inf.campaigns+'건']].map(([l,v])=>(
                    <div key={l} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                      <span className="text-[11px] text-gray-400">{l}</span>
                      <span className="text-[11px] font-semibold text-gray-800 font-mono">{v}</span>
                    </div>
                  ))}
                  <div className="pt-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-gray-400">부합도</span>
                      <span className="text-[11px] font-bold" style={{color:fc(inf.fit)}}>{inf.fit}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full" style={{width:inf.fit+'%',background:fc(inf.fit)}}/>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <button onClick={() => openEdit(inf)} className="flex-1 btn-primary text-xs py-1.5">수정</button>
                  <button onClick={() => inf.id && del(inf.id)} className="flex-1 btn-ghost text-xs py-1.5 text-red-500">삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center" onClick={()=>setModal(null)}>
          <div className="bg-white rounded-2xl w-[560px] max-h-[85vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{modal==='add'?'인플루언서 추가':'인플루언서 수정'}</h3>
              <button onClick={()=>setModal(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-semibold text-gray-600 mb-1 block">이름</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)}/></div>
                <div><label className="text-[11px] font-semibold text-gray-600 mb-1 block">계정</label><input className="input" value={form.handle} onChange={e=>set('handle',e.target.value)} placeholder="@handle"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-semibold text-gray-600 mb-1 block">플랫폼</label><select className="select" value={form.platform} onChange={e=>set('platform',e.target.value)}><option>인스타그램</option><option>틱톡</option><option>유튜브 쇼츠</option></select></div>
                <div><label className="text-[11px] font-semibold text-gray-600 mb-1 block">팔로워</label><input className="input" value={form.followers} onChange={e=>set('followers',e.target.value)} placeholder="예) 3.2만"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-semibold text-gray-600 mb-1 block">참여율</label><input className="input" value={form.engage} onChange={e=>set('engage',e.target.value)} placeholder="예) 5.2%"/></div>
                <div><label className="text-[11px] font-semibold text-gray-600 mb-1 block">부합도 (%)</label><input type="number" className="input" value={form.fit} onChange={e=>set('fit',parseInt(e.target.value)||0)}/></div>
              </div>
              <div><label className="text-[11px] font-semibold text-gray-600 mb-1 block">채널 톤</label><input className="input" value={form.tone} onChange={e=>set('tone',e.target.value)}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-semibold text-gray-600 mb-1 block">매칭 페르소나</label><input className="input" value={form.persona} onChange={e=>set('persona',e.target.value)}/></div>
                <div><label className="text-[11px] font-semibold text-gray-600 mb-1 block">리스크</label><select className="select" value={form.risk} onChange={e=>set('risk',e.target.value)}><option>없음</option><option>낮음</option><option>중간</option></select></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
              <button onClick={()=>setModal(null)} className="btn-ghost">취소</button>
              <button onClick={save} disabled={saving} className="btn-primary">{saving?'저장 중...':'저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
