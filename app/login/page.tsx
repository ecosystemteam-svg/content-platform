'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSession().then(s => { if (s) router.replace('/admin') })
  }, [])

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      router.replace('/admin')
    } catch (e: any) {
      setError(e.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light px-6">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 w-full max-w-[380px] shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-display font-extrabold text-3xl text-primary">CMS Admin</h1>
          <p className="text-slate-500 text-sm mt-1">ระบบจัดการบทความ</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 px-4 py-2.5 rounded-lg text-sm mb-4 border border-red-200">{error}</div>}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">อีเมล</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-light transition" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">รหัสผ่าน</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-light transition" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <button onClick={handleLogin} disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg text-sm font-semibold mt-2 hover:opacity-90 transition disabled:opacity-60">
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </div>

      <button onClick={() => router.push('/')} className="mt-6 text-white/60 text-sm hover:text-white/90 transition">← กลับหน้าหลัก</button>
    </div>
  )
}
