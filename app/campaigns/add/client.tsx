'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Brand, Product, Campaign, CampaignType } from '@/types'

export default function CampaignAddClient() {
  const router = useRouter()
  const params = useSearchParams()
  const campaignType = (params.get('type') || 'influencer') as CampaignType

  const [step, setStep] = useState(1)
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [members, setMembers] = useState<{id:string,email:string}[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<Partial<Campaign>>({
    type: campaignType,
    name: '',
    brand_id: '',
    product_id: '',
    manager_id: '',
    start_date: '',
    end_date: '',
    budget: 0,
    status: '임시',
    approval_status: '대기',
    content_type: campaignType==='influencer' ? '인스타그램 릴스' : '네이버 블로그',
    content_topic: '',
    upload_date: '',
    delivery_date: '',
    custom_hashtags: [],
    custom_cautions: [],
    custom_filming_guide: [],
    detail_images: [],
    description: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/brands').then(r=>r.json()),
      fetch('/api/products').then(r=>r.json()),
    ]).then(([b,p]) => {
      setBrands(Array.isArray(b)?b:[])
      setProducts(Array.isArray(p)?p:[])
    })
  }, [])

  const set = (k: string, v: any) => setForm(f => ({...f, [k]: v}))

  // 선택된 상품에서 데이터 가져오기 (Step 2 자동 채우기용)
  const selectedProduct = products.find(p => p.id === form.product_id)

  function pushItem(field: 'custom_hashtags'|'custom_cautions'|'custom_filming_guide'|'detail_images', e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const v = (e.target as HTMLInputElement).value.trim()
    if (!v) return
    set(field, [...(form as any)[field], v])
    ;(e.target as HTMLInputElement).value = ''
  }

  function removeItem(field: string, idx: number) {
    set(field, (form as any)[field].filter((_:any,i:number)=>i!==idx))
  }

  async function save(asDraft = false) {
    if (!form.name?.trim()) { alert('캠페인명을 입력해주세요'); setStep(1); return }
    setSaving(true)
    const body = {
      ...form,
      status: asDraft ? '임시' : '대기',
      brand_id: form.brand_id || null,
      product_id: form.product_id || null,
      manager_id: form.manager_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      upload_date: form.upload_date || null,
      delivery_date: form.delivery_date || null,
    }
    const res = await fetch('/api/campaigns', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    setSaving(false)
    if (data.error) alert('저장 실패: ' + data.error)
    else router.push(`/campaigns/${data.id}`)
  }

  const stepProgress = (step / 3) * 100

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={()=>router.back()} className="text-gray-500 hover:text-gray-900">←</button>
          <h1 className="text-[15px] font-bold text-gray-900">캠페인 정보 등록</h1>
          <span className="chip chip-green">{campaignType==='influencer'?'인플루언서':'블로그'}</span>
        </div>
        <button onClick={()=>save(true)} disabled={saving} className="btn-ghost text-xs">📝 임시저장</button>
      </div>

      <div className="p-7 max-w-3xl mx-auto">
        {/* STEP 진행도 */}
        <div className="card mb-5">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-[#1D9E75]">STEP {step}. {step===1?'브랜드 및 제품 정보':step===2?'콘텐츠 일정 및 가이드':'리뷰 및 등록'}</div>
              <div className="text-xs text-gray-500">{Math.round(stepProgress)}% 완료됨</div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-1.5 bg-[#1D9E75] rounded-full transition-all" style={{width: stepProgress+'%'}}/>
            </div>
            <div className="flex justify-between mt-3">
              {[1,2,3].map(s => (
                <button key={s} onClick={()=>setStep(s)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s<step?'bg-[#1D9E75] text-white':
                    s===step?'bg-[#1D9E75] text-white ring-4 ring-[#1D9E75]/20':
                    'bg-gray-100 text-gray-400'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 1 */}
        {step===1 && (
          <div className="space-y-4">
            <div className="card">
              <div className="card-header"><span className="card-title">캠페인 기본 정보</span></div>
              <div className="card-body space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">캠페인명 <span className="text-red-400">*</span></label>
                    <input className="input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="캠페인명을 입력하세요"/>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">브랜드명</label>
                    <select className="select" value={form.brand_id} onChange={e=>set('brand_id',e.target.value)}>
                      <option value="">— 선택 —</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">캠페인 시작일</label>
                    <input type="date" className="input" value={form.start_date} onChange={e=>set('start_date',e.target.value)}/>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">캠페인 종료일</label>
                    <input type="date" className="input" value={form.end_date} onChange={e=>set('end_date',e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">예산</label>
                  <input type="number" className="input" value={form.budget} onChange={e=>set('budget',parseInt(e.target.value)||0)} placeholder="예산을 입력하세요"/>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">제품 선택</span></div>
              <div className="card-body space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">제품</label>
                  <select className="select" value={form.product_id} onChange={e=>set('product_id',e.target.value)}>
                    <option value="">— 등록된 제품 선택 —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.brand?.name && `(${p.brand.name})`}</option>)}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">제품을 선택하면 PDF 가이드가 자동 생성돼요</p>
                </div>
                {selectedProduct && (
                  <div className="p-3 bg-[#E6F7F1] rounded-lg border border-[#A7E3CE] flex gap-3">
                    {selectedProduct.image_url && (
                      <img src={selectedProduct.image_url} alt="" className="w-14 h-14 rounded-lg object-cover bg-white"/>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">{selectedProduct.name}</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">{selectedProduct.brand?.name} · {selectedProduct.category?.name}</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">핵심 소구점 {selectedProduct.features?.length || 0}개 · 해시태그 {selectedProduct.hashtags?.length || 0}개</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <div className="space-y-4">
            <div className="card">
              <div className="card-header"><span className="card-title">콘텐츠 일정</span></div>
              <div className="card-body space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">업로드 일정</label>
                    <input type="date" className="input" value={form.upload_date} onChange={e=>set('upload_date',e.target.value)}/>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">1차 콘텐츠 전달 일정</label>
                    <input type="date" className="input" value={form.delivery_date} onChange={e=>set('delivery_date',e.target.value)}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">콘텐츠 유형</label>
                    <input className="input" value={form.content_type} onChange={e=>set('content_type',e.target.value)} placeholder="예: 인스타그램 릴스"/>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">콘텐츠 주제</label>
                    <input className="input" value={form.content_topic} onChange={e=>set('content_topic',e.target.value)} placeholder="예: 출근길 루틴"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">캠페인 커스텀 가이드 <span className="text-gray-400 font-normal text-[10px]">(비워두면 제품 기본값 사용)</span></span>
              </div>
              <div className="card-body space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block"># 추가 해시태그</label>
                  <input className="input mb-2 text-sm" placeholder="#태그 입력 후 Enter" onKeyDown={e=>pushItem('custom_hashtags',e)}/>
                  <div className="flex flex-wrap gap-1.5">
                    {form.custom_hashtags?.map((t, i) => (
                      <span key={i} className="inline-flex items-center gap-1 chip chip-green">
                        {t}<button onClick={()=>removeItem('custom_hashtags',i)} className="text-[#0F6E56]">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">⚠️ 추가 유의사항</label>
                  <input className="input mb-2 text-sm" placeholder="유의사항 입력 후 Enter" onKeyDown={e=>pushItem('custom_cautions',e)}/>
                  {form.custom_cautions?.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs mb-1">
                      <span className="flex-1 text-gray-700">{t}</span>
                      <button onClick={()=>removeItem('custom_cautions',i)} className="text-gray-400 hover:text-red-500">✕</button>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">🎬 추가 촬영 가이드</label>
                  <input className="input mb-2 text-sm" placeholder="촬영 가이드 입력 후 Enter" onKeyDown={e=>pushItem('custom_filming_guide',e)}/>
                  {form.custom_filming_guide?.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs mb-1">
                      <span className="flex-1 text-gray-700">{t}</span>
                      <button onClick={()=>removeItem('custom_filming_guide',i)} className="text-gray-400 hover:text-red-500">✕</button>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">📷 캠페인 상세 이미지 URL (최대 5장)</label>
                  <input className="input mb-2 text-sm" placeholder="이미지 URL 입력 후 Enter" onKeyDown={e=>pushItem('detail_images',e)}/>
                  {form.detail_images?.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs mb-1">
                      <span className="flex-1 text-gray-700 truncate">{t}</span>
                      <button onClick={()=>removeItem('detail_images',i)} className="text-gray-400 hover:text-red-500">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step===3 && (
          <div className="space-y-4">
            <div className="card">
              <div className="card-header"><span className="card-title">캠페인 설명</span></div>
              <div className="card-body">
                <textarea className="textarea min-h-[120px]" value={form.description} onChange={e=>set('description',e.target.value)}
                  placeholder="캠페인 목적, 진행 방식, 특이사항 등을 자유롭게 적어주세요"/>
              </div>
            </div>

            <div className="card bg-[#E6F7F1] border-[#A7E3CE]">
              <div className="card-body">
                <div className="text-sm font-bold text-[#0F6E56] mb-3">📋 캠페인 정보 요약</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-500">캠페인명</div><div className="text-gray-900 font-medium">{form.name||'—'}</div>
                  <div className="text-gray-500">브랜드</div><div className="text-gray-900 font-medium">{brands.find(b=>b.id===form.brand_id)?.name||'—'}</div>
                  <div className="text-gray-500">제품</div><div className="text-gray-900 font-medium">{selectedProduct?.name||'—'}</div>
                  <div className="text-gray-500">기간</div><div className="text-gray-900 font-medium">{form.start_date||'—'} ~ {form.end_date||'—'}</div>
                  <div className="text-gray-500">예산</div><div className="text-gray-900 font-medium font-mono">{form.budget?form.budget.toLocaleString()+'원':'—'}</div>
                  <div className="text-gray-500">콘텐츠 유형</div><div className="text-gray-900 font-medium">{form.content_type||'—'}</div>
                  <div className="text-gray-500">업로드 일정</div><div className="text-gray-900 font-medium">{form.upload_date||'—'}</div>
                </div>
              </div>
            </div>

            <div className="card bg-blue-50 border-blue-200">
              <div className="card-body">
                <div className="text-xs text-blue-800 leading-relaxed">
                  💡 등록 후 캠페인 상세 페이지에서:<br/>
                  → AI 대본 생성 + 페르소나 연결<br/>
                  → 인플루언서에게 전달할 PDF 가이드 자동 생성
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-between gap-2 mt-6 pt-5 border-t border-gray-200">
          <button onClick={()=>step>1?setStep(step-1):router.back()} className="btn-ghost">
            ← {step>1?'이전 단계':'목록으로'}
          </button>
          {step<3 ? (
            <button onClick={()=>setStep(step+1)} className="btn-primary">다음 단계로 이동 →</button>
          ) : (
            <button onClick={()=>save(false)} disabled={saving} className="btn-primary px-7">
              {saving?'등록 중...':'✓ 캠페인 등록'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
