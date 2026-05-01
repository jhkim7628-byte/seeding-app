'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않아요')
      setLoading(false)
    } else {
      router.push(next)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setLoading(false)
    if (error) setError('이메일 발송에 실패했어요')
    else setResetSent(true)
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0D1117] flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">🌿</div>
          <h1 className="text-xl font-black text-gray-900">현신바이오</h1>
          <p className="text-sm text-gray-400 mt-1">시딩 캠페인 관리 시스템</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
          {mode === 'login' ? (
            <>
              <h2 className="text-base font-bold text-gray-900 mb-5">로그인</h2>
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">이메일</label>
                  <input
                    type="email" required autoComplete="email"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10"
                    placeholder="team@company.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 mb-1 block">비밀번호</label>
                  <input
                    type="password" required autoComplete="current-password"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10"
                    placeholder="비밀번호 입력"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>
                {error && <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-semibold text-sm rounded-lg transition-colors mt-1 disabled:opacity-60">
                  {loading ? '로그인 중...' : '로그인'}
                </button>
              </form>
              <button onClick={() => setMode('reset')} className="mt-4 text-xs text-gray-400 hover:text-gray-600 w-full text-center">
                비밀번호를 잊으셨나요?
              </button>
            </>
          ) : (
            <>
              <h2 className="text-base font-bold text-gray-900 mb-1">비밀번호 재설정</h2>
              <p className="text-xs text-gray-400 mb-5">가입한 이메일로 재설정 링크를 보내드릴게요</p>
              {resetSent ? (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">📧</div>
                  <p className="text-sm text-gray-700 font-medium">이메일을 확인해주세요</p>
                  <p className="text-xs text-gray-400 mt-1">{email}로 링크를 발송했어요</p>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">이메일</label>
                    <input type="email" required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      placeholder="team@company.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  {error && <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-semibold text-sm rounded-lg transition-colors">
                    {loading ? '발송 중...' : '재설정 링크 발송'}
                  </button>
                </form>
              )}
              <button onClick={() => setMode('login')} className="mt-4 text-xs text-gray-400 hover:text-gray-600 w-full text-center">
                ← 로그인으로 돌아가기
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-5">
          계정이 없으신가요? 관리자에게 초대를 요청하세요
        </p>
      </div>
    </div>
  )
}
