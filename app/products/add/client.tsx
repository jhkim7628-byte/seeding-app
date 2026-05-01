'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Brand, Category, Feature } from '@/types'

const EMPTY_FEATURE: Feature = { title: '', sub: ['', ''] }
const DEFAULT_FORM = {
  name: '',
  brand_id: '',
  category_id: '',
  url: '',
  price: 0,
  image_url: '',
  brand_color: '#1D9E75',
  features: [{...EMPTY_FEATURE}, {...EMPTY_FEATURE}, {...EMPTY_FEATURE}],
  hashtags: [] as string[],
  cautions: [] as string[],
  references_text: [] as string[],
  mention_guide: [] as string[],
  must_requests: [] as string[],
  filming_guide: [] as string[],
}

export default function ProductAddClient() {
  const router = useRouter()
  const params = useSearchParams()
  const editId = params.get('id')

  const [form, setForm] = useState({...DEFAULT_FORM})
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!editId)
  const [newBrand, setNewBrand] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/brands').then(r=>r.json()),
      fetch('/api/categories').then(r=>r.json()),
    ]).then(([b,c]) => {
      setBrands(Array.isArray(b)?b:[])
      setCategories(Array.isArray(c)?c:[])
    })
    if (editId) {
      fetch(`/api/products/${editId}`).then(r=>r.json()).then(p => {
        if (p && !p.error) setForm({...DEFAULT_FORM, ...p})
        setLoading(false)
      })
    }
  }, [editId])

  const set = (k: string, v: any) => setForm(f => ({...f, [k]: v}))

  function addTag(field: 'hashtags'|'cautions'|'references_text'|'mention_guide'|'must_requests'|'filming_guide', e: React.KeyboardEvent) {
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

  async function addBrand() {
    if (!newBrand.trim()) return
    const res = await fetch('/api/brands', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newBrand,intro:''})})
    const data = await res.json()
    setBrands([...brands, data])
    set('brand_id', data.id)
    setNewBrand('')
  }

  async function save() {
    if (!form.name.trim()) { alert('상품명을 입력해주세요'); return }
    setSaving(true)
    const url = editId ? `/api/products/${editId}` : '/api/products'
    const method = editId ? 'PATCH' : 'POST'
    const body = {...form, brand_id: form.brand_id || null, category_id: form.category_id || null}
    const res = await fetch(url, {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await res.json()
    setSaving(false)
    if (data.error) alert('저장 실패: ' + data.error)
    else router.push('/products')
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={()=>router.back()} className="text-gray-500 hover:text-gray-900">←</button>
          <h1 className="text-[15px] font-bold text-gray-900">{editId ? '상품 수정' : '신규 상품 등록'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>router.back()} className="btn-ghost">취소</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving?'저장 중...':'💾 저장'}</button>
        </div>
      </div>

      <div className="p-7">
        <div className="grid grid-cols-2 gap-4">
          {/* LEFT */}
          <div className="space-y-4">
            <div className="card">
              <div className="card-header"><span className="card-title">기본 정보</span></div>
              <div className="card-body space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">상품명 <span className="text-red-400">*</span></label>
                  <input className="input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="예) 식이섬유샷"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">브랜드</label>
                    <select className="select" value={form.brand_id} onChange={e=>set('brand_id',e.target.value)}>
                      <option value="">— 선택 —</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <div className="flex gap-1 mt-1">
                      <input className="input flex-1 text-xs" value={newBrand} onChange={e=>setNewBrand(e.target.value)} placeholder="새 브랜드 추가"/>
                      <button onClick={addBrand} className="btn-sm">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">카테고리</label>
                    <select className="select" value={form.category_id} onChange={e=>set('category_id',e.target.value)}>
                      <option value="">— 선택 —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">시중가</label>
                    <input type="number" className="input" value={form.price} onChange={e=>set('price',parseInt(e.target.value)||0)} placeholder="29900"/>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">제품 URL</label>
                    <input className="input" value={form.url} onChange={e=>set('url',e.target.value)} placeholder="https://..."/>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">제품 이미지 URL</label>
                  <input className="input" value={form.image_url} onChange={e=>set('image_url',e.target.value)} placeholder="https://..."/>
                  <p className="text-[10px] text-gray-400 mt-1">PDF 가이드 표지 + 제품 페이지 자동 삽입</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">🎨 브랜드 컬러 (PDF 자동 적용)</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                      value={form.brand_color} onChange={e=>set('brand_color',e.target.value)}/>
                    <input className="input flex-1 font-mono text-sm" value={form.brand_color} onChange={e=>set('brand_color',e.target.value)} placeholder="#C8102E"/>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[
                      ['#C8102E', '루비/빨강'],
                      ['#1D9E75', '식이섬유/초록'],
                      ['#3182CE', '시원함/파랑'],
                      ['#7C3AED', '프리미엄/보라'],
                      ['#F59E0B', '활력/주황'],
                      ['#EC4899', '뷰티/핑크'],
                      ['#1a1a1a', '미니멀/검정'],
                    ].map(([c, l]) => (
                      <button key={c} onClick={() => set('brand_color', c)} type="button"
                        className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:border-gray-400 flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{background: c}}/>
                        {l}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">PDF 표지 배경, 테두리, 강조 색상에 자동 적용돼요</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">핵심 소구점 (PDF용)</span>
                <button onClick={()=>set('features',[...form.features, {...EMPTY_FEATURE}])} className="btn-sm">+ 추가</button>
              </div>
              <div className="card-body space-y-3">
                {form.features.map((f, i) => (
                  <div key={i} className="p-3 bg-[#FFF5F5] border-l-[3px] border-red-400 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-red-500 mt-2">- </span>
                      <input className="input bg-white flex-1 text-sm font-bold"
                        value={f.title} onChange={e=>set('features',form.features.map((x,j)=>j===i?{...x,title:e.target.value}:x))}
                        placeholder={`헤드라인 ${i+1} (예: 하루 한 포, 간편하게 완성하는 사과 루틴)`}/>
                      {form.features.length > 1 && (
                        <button onClick={()=>set('features',form.features.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-400 mt-2">✕</button>
                      )}
                    </div>
                    {f.sub.map((s, si) => (
                      <div key={si} className="flex items-center gap-2 mt-1.5 ml-4">
                        <span className="text-xs text-gray-500">ㄴ</span>
                        <input className="input bg-white flex-1 text-xs"
                          value={s} onChange={e=>set('features',form.features.map((x,j)=>j===i?{...x,sub:x.sub.map((y,k)=>k===si?e.target.value:y)}:x))}
                          placeholder="서브 설명"/>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            {[
              {field:'hashtags', label:'해시태그', icon:'#', color:'green', ph:'예: #피럴킴 #식이섬유샷'},
              {field:'cautions', label:'유의사항', icon:'⚠️', color:'red', ph:'예: 자사 제품 우수성 강조해주세요'},
              {field:'mention_guide', label:'멘션 작성 가이드', icon:'✍️', color:'blue', ph:'예: 바쁜데 귀찮고 복잡하게 관리하기 싫지 않아?'},
              {field:'must_requests', label:'필수 요청사항', icon:'✅', color:'green', ph:'예: 크리에이터님 워딩으로 제품 소개해주세요'},
              {field:'filming_guide', label:'영상 촬영 가이드', icon:'🎬', color:'amber', ph:'예: 패키지와 개별 제품이 잘 보일 수 있도록'},
              {field:'references_text', label:'참고사항', icon:'ℹ️', color:'gray', ph:'예: 피부 X → 피부와 직접 연관 지어 설명 불가'},
            ].map(({field,label,icon,color,ph}) => (
              <div key={field} className="card">
                <div className="card-header">
                  <span className="card-title">{icon} {label} <span className="text-gray-400 font-normal">({(form as any)[field].length})</span></span>
                </div>
                <div className="card-body">
                  <input className="input mb-2 text-sm" placeholder={ph + ' (Enter로 추가)'} onKeyDown={e=>addTag(field as any, e)}/>
                  {(form as any)[field].length > 0 && (
                    <div className="space-y-1.5">
                      {(form as any)[field].map((v: string, i: number) => (
                        <div key={i} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                          color==='red'?'bg-red-50 border border-red-200':
                          color==='blue'?'bg-blue-50 border border-blue-200':
                          color==='amber'?'bg-amber-50 border border-amber-200':
                          color==='gray'?'bg-gray-50 border border-gray-200':
                          'bg-[#E6F7F1] border border-[#A7E3CE]'
                        }`}>
                          <span className="flex-1 text-gray-700 whitespace-pre-wrap">{v}</span>
                          <button onClick={()=>removeItem(field, i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-5 border-t border-gray-200">
          <button onClick={()=>router.back()} className="btn-ghost">취소</button>
          <button onClick={save} disabled={saving} className="btn-primary px-7 py-2 text-sm">
            {saving?'저장 중...':'💾 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
