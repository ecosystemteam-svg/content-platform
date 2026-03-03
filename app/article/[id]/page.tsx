'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getArticleById, incrementView } from '@/lib/supabase'
import type { Article } from '@/lib/supabase'
import { ShareButtons } from '@/components/ui'

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Number(params.id)
    if (!id) return
    loadArticle(id)
  }, [params.id])

  async function loadArticle(id: number) {
    try {
      const a = await getArticleById(id)
      setArticle(a)
      await incrementView(id)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">กำลังโหลด...</div>
  if (!article) return <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">ไม่พบบทความ</div>

  const cat = article.categories as any

  return (
    <>
      <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-cyan-400 transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h2 className="font-display font-bold text-lg text-primary-dark">บทความ</h2>
        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">{(article.views + 1).toLocaleString()} views</span>
      </header>

      {article.cover_image && <img src={article.cover_image} alt="" className="w-full h-56 object-cover" />}

      <div className="px-5 py-5 pb-10">
        {cat && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-2" style={{ background: cat.color }}>{cat.name}</span>}
        <h1 className="text-xl font-bold leading-snug mb-1.5">{article.title}</h1>
        {article.subtitle && <p className="text-sm text-slate-500 mb-4">{article.subtitle}</p>}

        <div className="flex items-center gap-3.5 py-3.5 border-y border-slate-200 mb-5 text-sm text-slate-500 flex-wrap">
          <span>{article.published_at}</span>
          <span>{article.read_min} min read</span>
          <span>{(article.views + 1).toLocaleString()} views</span>
        </div>

        <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />

        {article.ref_link && (
          <a href={article.ref_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2.5 bg-cyan-50 rounded-lg text-primary text-sm font-medium border border-cyan-200 hover:bg-cyan-100 transition">อ่านเพิ่มเติม</a>
        )}

        <ShareButtons title={article.title} articleId={article.id} />
      </div>
    </>
  )
}
