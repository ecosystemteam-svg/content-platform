'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCategories, getPublishedArticles, getBanner } from '@/lib/supabase'
import type { Article, Category, BannerSettings } from '@/lib/supabase'
import { ToastProvider } from '@/components/ui'

function HomePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banner, setBanner] = useState<BannerSettings | null>(null)
  const [activeCat, setActiveCat] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadArticles() }, [activeCat])

  async function loadData() {
    try {
      const [cats, bn] = await Promise.all([getCategories(), getBanner()])
      setCategories(cats)
      setBanner(bn)
      await loadArticles()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function loadArticles() {
    try {
      const arts = await getPublishedArticles(activeCat || undefined)
      setArticles(arts)
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">กำลังโหลด...</div>

  return (
    <>
      <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <h2 className="font-display font-bold text-lg text-primary-dark">Must-Reads</h2>
        <Link href="/login" className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-cyan-400 hover:text-primary transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </Link>
      </header>

      <div className="px-4 pt-5 pb-1">
        <p className="font-display text-xs font-bold text-primary-light tracking-widest uppercase">Must-Reads for You</p>
        <h1 className="font-display text-xl font-extrabold text-primary-dark leading-tight mt-0.5">บทความสำหรับคุณ</h1>
        <p className="text-sm text-slate-500 mt-1">บทความคัดสรรเพื่อคุณ</p>
      </div>

      {banner && (
        <div className="mx-4 mt-3 rounded-xl overflow-hidden relative h-40 bg-gradient-to-br from-primary-dark to-primary">
          {banner.image && <img src={banner.image} alt="" className="w-full h-full object-cover opacity-45" />}
          <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-black/65 to-transparent text-white">
            <h2 className="text-xl font-bold leading-tight">{banner.title}</h2>
            <p className="text-sm opacity-85 mt-0.5">{banner.subtitle}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 px-4 py-4 overflow-x-auto">
        <button className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${!activeCat ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-500'}`} onClick={() => setActiveCat(null)}>ทั้งหมด</button>
        {categories.map(c => (
          <button key={c.id} className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${activeCat === c.id ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500'}`} style={activeCat === c.id ? { background: c.color, borderColor: c.color } : {}} onClick={() => setActiveCat(c.id)}>{c.name}</button>
        ))}
      </div>

      <div className="px-4 pb-6 flex flex-col gap-3.5">
        {articles.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">ยังไม่มีบทความในหมวดนี้</div>}
        {articles.map(a => {
          const cat = a.categories || categories.find(c => c.id === a.category_id)
          return (
            <Link href={`/article/${a.id}`} key={a.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition">
              {a.cover_image && (
                <div className="w-full bg-slate-100">
                  <img src={a.cover_image} alt="" className="w-full aspect-square object-contain" />
                </div>
              )}
              <div className="p-3.5">
                {cat && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-1.5 w-fit" style={{ background: (cat as any).color }}>{(cat as any).name}</span>}
                <p className="text-sm font-semibold leading-snug line-clamp-2">{a.title}</p>
                <div className="flex items-center gap-2.5 mt-2 text-[11px] text-slate-400">
                  <span>{a.read_min} min</span>
                  <span>{a.views.toLocaleString()} views</span>
                  <span>{a.published_at}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

export default function Page() {
  return <ToastProvider><HomePage /></ToastProvider>
}
