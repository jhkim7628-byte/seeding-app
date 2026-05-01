'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Member {
  id: string
  email: string
  role: 'admin' | 'editor'
  created_at: string
  last_sign_in?: string
}

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor'>('editor')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [currentUser, setCurrentUser] = useState<{email:string,role:string}|null>(null)

  useEffect(() => {
    loadMembers()
    loadCurrentUser()
  }, [])

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('team_members').select('role').eq('user_id', user.id).single()
    setCurrentUser({ email: user.email || '', role: data?.role || 'editor' })
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true })
    setMembers(data || [])
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setLoading(true)

    // Supabase Admin API로 초대 이메일 발송
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail)

    if (error || !data?.user) {
      showToast('❌ 초대 실패: ' + (error?.message || '다시 시도해주세요'))
      setLoading(false)
      return
    }

    // team_members 테이블에 역할 저장
    await supabase.from('team_members').insert([{
      user_id: data.user.id,
      email: inviteEmail,
      role: inviteRole,
    }])

    setInviteEmail('')
    setLoading(false)
    showToast('✓ 초대 이메일을 발송했어요')
    loadMembers()
  }

  async function changeRole(id: string, role: 'admin' | 'editor') {
    await supabase.from('team_members').update({ role }).eq('id', id)
    setMembers(members.map(m => m.id === id ? { ...m, role } : m))
    showToast('✓ 권한을 변경했어요')
  }

  async function removeMember(id: string, email: string) {
    if (!confirm(`${email} 계정을 삭제할까요?`)) return
    await supabase.from('team_members').delete().eq('id', id)
    setMembers(members.filter(m => m.id !== id))
    showToast('✓ 팀원을 삭제했어요')
  }

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(''), 3000)
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1D9E75] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg z-50">{toast}</div>
      )}
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">팀원 관리</h1>
          <span className="chip chip-green">{members.length}명</span>
        </div>
      </div>

      <div className="p-7 max-w-2xl">

        {/* 권한 안내 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#E6F7F1] border border-[#A7E3CE] rounded-xl p-4">
            <div className="text-xs font-bold text-[#0F6E56] mb-2">👑 관리자 (Admin)</div>
            <div className="text-[11px] text-gray-700 space-y-1">
              <div>✓ 모든 데이터 읽기·쓰기·삭제</div>
              <div>✓ 팀원 초대·권한 변경·삭제</div>
              <div>✓ 제품 세팅 변경</div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-xs font-bold text-blue-700 mb-2">✏️ 편집자 (Editor)</div>
            <div className="text-[11px] text-gray-700 space-y-1">
              <div>✓ 모든 데이터 읽기·쓰기</div>
              <div>✓ 페르소나·인플루언서 추가·수정</div>
              <div>✕ 팀원 관리 불가</div>
            </div>
          </div>
        </div>

        {/* 초대 폼 */}
        {isAdmin && (
          <div className="card mb-5">
            <div className="card-header"><span className="card-title">팀원 초대</span></div>
            <div className="card-body">
              <form onSubmit={inviteMember} className="flex gap-2">
                <input
                  type="email" required
                  className="input flex-1"
                  placeholder="초대할 이메일 주소"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
                <select
                  className="select w-32"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'admin' | 'editor')}
                >
                  <option value="editor">편집자</option>
                  <option value="admin">관리자</option>
                </select>
                <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
                  {loading ? '발송 중...' : '초대 발송'}
                </button>
              </form>
              <p className="text-[11px] text-gray-400 mt-2">
                초대 이메일을 받은 팀원이 링크를 클릭하면 계정이 생성돼요
              </p>
            </div>
          </div>
        )}

        {/* 팀원 목록 */}
        <div className="card">
          <div className="card-header"><span className="card-title">현재 팀원</span></div>
          <div className="divide-y divide-gray-100">
            {members.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">등록된 팀원이 없어요</div>
            ) : (
              members.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-[#0D1117] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {m.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{m.email}</div>
                    <div className="text-[11px] text-gray-400">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString('ko-KR') + ' 가입' : ''}
                    </div>
                  </div>
                  {isAdmin ? (
                    <select
                      value={m.role}
                      onChange={e => changeRole(m.id, e.target.value as 'admin' | 'editor')}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#1D9E75]"
                    >
                      <option value="admin">관리자</option>
                      <option value="editor">편집자</option>
                    </select>
                  ) : (
                    <span className={`chip ${m.role === 'admin' ? 'chip-green' : 'chip-blue'}`}>
                      {m.role === 'admin' ? '관리자' : '편집자'}
                    </span>
                  )}
                  {isAdmin && m.email !== currentUser?.email && (
                    <button onClick={() => removeMember(m.id, m.email)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-sm ml-1">✕</button>
                  )}
                  {m.email === currentUser?.email && (
                    <span className="text-[10px] text-gray-400 ml-1">나</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
