'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Product, Category } from '@/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCat, setNewCat] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [p, c] = await Promise.all([
      fetch('/api/products').then(r=>r.json()),
      fetch('/api/categories').then(r=>r.json()),
    ])
    setProducts(Array.isArray(p)?p:[])
    setCategories(Array.isArray(c)?c:[])
    setLoading(false)
  }

  async function addCategory() {
    if (!newCat.trim()) return
    await fetch('/api/categories', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name: newCat}) })
    setNewCat('')
    loadAll()
  }

  async function deleteCategory(id: string) {
    if (!confirm('카테고리를 삭제할까요?')) return
    await fetch(`/api/categories?id=${id}`, { method:'DELETE' })
    loadAll()
  }

  async function deleteProduct(id: string) {
    if (!confirm('상품을 삭제할까요?')) return
    await fetch(`/api/products/${id}`, { method:'DELETE' })
    loadAll()
  }

  const filtered = filterCat === 'all' ? products : products.filter(p => p.category_id === filterCat)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">상품 관리</h1>
          <span className="chip chip-green">{products.length}개</span>
        </div>
        <Link href="/products/add" className="btn-primary">+ 신규 상품 등록</Link>
      </div>

      <div className="p-7 space-y-5">
        {/* 카테고리 관리 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">카테고리 관리 <span className="text-gray-400 text-xs ml-1">({categories.length})</span></span>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs">
                  {c.name}
                  <button onClick={() => c.id && deleteCategory(c.id)} className="text-gray-400 hover:text-red-500">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" value={newCat} onChange={e=>setNewCat(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addCategory()} placeholder="새 카테고리 입력 후 Enter"/>
              <button onClick={addCategory} className="btn-primary">+ 추가</button>
            </div>
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">전체 상품 목록</span>
            <div className="flex gap-1.5">
              <button onClick={()=>setFilterCat('all')}
                className={`text-xs px-3 py-1 rounded-full border ${filterCat==='all'?'bg-[#1D9E75] text-white border-[#1D9E75]':'bg-white text-gray-600 border-gray-200'}`}>전체</button>
              {categories.map(c => (
                <button key={c.id} onClick={()=>setFilterCat(c.id||'')}
                  className={`text-xs px-3 py-1 rounded-full border ${filterCat===c.id?'bg-[#1D9E75] text-white border-[#1D9E75]':'bg-white text-gray-600 border-gray-200'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">📦</div>
              등록된 상품이 없어요
            </div>
          ) : (
            <div>
              <div className="bg-[#0D1117] grid text-[10px] text-gray-400 font-semibold uppercase tracking-wide"
                style={{gridTemplateColumns:'80px 1fr 100px 100px 130px 100px'}}>
                {['이미지','상품명','카테고리','브랜드','가격','관리'].map(h => (
                  <div key={h} className="px-3 py-2">{h}</div>
                ))}
              </div>
              {filtered.map(p => (
                <div key={p.id} className="grid border-b border-gray-50 hover:bg-gray-50 transition-colors items-center"
                  style={{gridTemplateColumns:'80px 1fr 100px 100px 130px 100px'}}>
                  <div className="px-3 py-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100"/>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg">📦</div>
                    )}
                  </div>
                  <div className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                    {p.url && <div className="text-[11px] text-gray-400 truncate max-w-md">{p.url}</div>}
                  </div>
                  <div className="px-3 py-3">
                    {p.category && <span className="chip chip-green">{p.category.name}</span>}
                  </div>
                  <div className="px-3 py-3 text-xs text-gray-700">{p.brand?.name || '—'}</div>
                  <div className="px-3 py-3 text-xs font-semibold font-mono text-gray-900">{p.price ? p.price.toLocaleString()+'원' : '—'}</div>
                  <div className="px-3 py-3 flex gap-1.5">
                    <Link href={`/products/add?id=${p.id}`} className="btn-sm">수정</Link>
                    <button onClick={() => p.id && deleteProduct(p.id)} className="btn-sm text-red-500 hover:border-red-400">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
