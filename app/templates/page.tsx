'use client'
import { useEffect, useState } from 'react'
import { BlogTemplate } from '@/types'

const CATEGORIES = ['인플루언서 시딩', '샘플 발송', '리마인드', '감사 인사', '기타']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<BlogTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<BlogTemplate | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch('/api/templates').then(r=>r.json())
    setTemplates(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function save(t: Partial<BlogTemplate>) {
    if (t.id) {
      await fetch('/api/templates', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(t) })
    } else {
      await fetch('/api/templates', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(t) })
    }
    setEditing(null); setShowNew(false)
    load()
  }

  async function del(id: string) {
    if (!confirm('템플릿을 삭제할까요?')) return
    await fetch(`/api/templates?id=${id}`, { method: 'DELETE' })
    load()
  }

  async function copyToClipboard(t: BlogTemplate) {
    await navigator.clipboard.writeText(t.content)
    setToast(`✓ ${t.name} 복사됨`)
    setTimeout(()=>setToast(''), 2000)

    // 사용 횟수 증가
    if (t.id) {
      await fetch('/api/templates', {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id: t.id, used_count: (t.used_count || 0) + 1}),
      })
      load()
    }
  }

  const filtered = filter === 'all' ? templates : templates.filter(t => t.category === filter)

  return (
    <div>
      {toast && <div className="fixed bottom-6 right-6 bg-[#1D9E75] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg z-50">{toast}</div>}

      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">시딩 문구 템플릿</h1>
          <span className="chip chip-green">{templates.length}개</span>
        </div>
        <button onClick={()=>setShowNew(true)} className="btn-primary">+ 새 템플릿</button>
      </div>

      <div className="p-7 max-w-5xl mx-auto">
        <div className="card bg-blue-50 border-blue-200 mb-5">
          <div className="card-body">
            <div className="text-xs text-blue-800 leading-relaxed">
              💡 인플루언서 시딩 시 자주 쓰는 메시지 템플릿이에요. <strong>[크리에이터명], [브랜드명], [업로드일]</strong> 같은 변수는 복사 후 직접 채워넣으면 돼요.
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={()=>setFilter('all')}
            className={`text-xs px-3 py-1 rounded-full border ${filter==='all'?'bg-[#1D9E75] text-white border-[#1D9E75]':'bg-white text-gray-600 border-gray-200'}`}>
            전체
          </button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={()=>setFilter(c)}
              className={`text-xs px-3 py-1 rounded-full border ${filter===c?'bg-[#1D9E75] text-white border-[#1D9E75]':'bg-white text-gray-600 border-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12 text-gray-400">
              <div className="text-3xl mb-2">📝</div>
              템플릿이 없어요
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(t => (
              <div key={t.id} className="card overflow-hidden">
                <div className="card-header">
                  <div className="flex-1 min-w-0">
                    <span className="card-title">{t.name}</span>
                    <span className="ml-2 chip chip-gray text-[10px]">{t.category}</span>
                  </div>
                </div>
                <div className="card-body">
                  <pre className="bg-gray-50 rounded-lg p-3 text-xs leading-relaxed text-gray-700 whitespace-pre-wrap border border-gray-200 max-h-48 overflow-y-auto font-[inherit]">{t.content}</pre>

                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.tags.map((tag, i) => <span key={i} className="chip chip-gray text-[10px]">{tag}</span>)}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400">사용 {t.used_count || 0}회</span>
                    <div className="flex gap-1.5">
                      <button onClick={()=>copyToClipboard(t)} className="text-xs px-3 py-1 rounded bg-[#1D9E75] text-white font-semibold">📋 복사</button>
                      <button onClick={()=>setEditing(t)} className="btn-sm">수정</button>
                      <button onClick={()=>t.id && del(t.id)} className="btn-sm text-red-500 hover:border-red-400">삭제</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showNew || editing) && (
        <TemplateModal
          template={editing}
          onClose={() => { setEditing(null); setShowNew(false) }}
          onSave={save}
        />
      )}
    </div>
  )
}

function TemplateModal({ template, onClose, onSave }: any) {
  const [form, setForm] = useState<BlogTemplate>(template || {
    name: '',
    category: '인플루언서 시딩',
    content: '',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')

  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl w-[640px] max-h-[85vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-bold">{template ? '템플릿 수정' : '새 템플릿'}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">✕</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 mb-1 block">템플릿 이름</label>
            <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="예: 첫 인사 - 정중"/>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 mb-1 block">카테고리</label>
            <select className="select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 mb-1 block">템플릿 내용</label>
            <textarea className="textarea min-h-[200px]" value={form.content} onChange={e=>setForm({...form,content:e.target.value})}
              placeholder={'안녕하세요! [브랜드명] 마케팅팀입니다.\n\n[크리에이터명]님의 콘텐츠를 잘 보고 있습니다.'}/>
            <div className="text-[10px] text-gray-400 mt-1">변수는 [대괄호]로 감싸세요. 예: [크리에이터명], [브랜드명], [업로드일]</div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 mb-1 block">태그</label>
            <input className="input mb-2" value={tagInput} onChange={e=>setTagInput(e.target.value)}
              onKeyDown={e=>{
                if (e.key==='Enter' && tagInput.trim()) {
                  e.preventDefault()
                  setForm({...form, tags: [...(form.tags||[]), tagInput.trim()]})
                  setTagInput('')
                }
              }} placeholder="태그 입력 후 Enter"/>
            <div className="flex flex-wrap gap-1.5">
              {(form.tags||[]).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 chip chip-green">
                  {t}<button onClick={()=>setForm({...form, tags: form.tags.filter((_,j)=>j!==i)})} className="text-[#0F6E56]">✕</button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost">취소</button>
          <button onClick={()=>onSave(form)} className="btn-primary">저장</button>
        </div>
      </div>
    </div>
  )
}
