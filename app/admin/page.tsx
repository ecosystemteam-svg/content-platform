'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getSession, signOut, getCategories, getAllArticles, getBanner,
  upsertArticle, deleteArticle, upsertCategory, deleteCategory,
  updateBanner, uploadImage, getStatsSummary,
  type Article, type Category, type BannerSettings
} from '@/lib/supabase'
import { ToastProvider, useToast, ImageUpload, RichTextEditor } from '@/components/ui'

function AdminInner() {
  const router = useRouter()
  const { show } = useToast()
  const [tab, setTab] = useState<'articles' | 'categories' | 'banner' | 'stats'>('articles')
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banner, setBanner] = useState<BannerSettings | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Article> | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6366f1')
  const [bnTitle, setBnTitle] = useState('')
  const [bnSub, setBnSub] = useState('')
  const [bnFile, setBnFile] = useState<File | null>(null)

  useEffect(() => { checkAuth() }, [])
  useEffect(() => { if (tab === 'stats') loadStats() }, [tab])

  async function checkAuth() {
    const session = await getSession()
    if (!session) { router.replace('/login'); return }
    await loadAll()
    setLoading(false)
  }

  async function loadAll() {
    try {
      const [cats, arts, bn] = await Promise.all([getCategories(), getAllArticles(), getBanner()])
      setCategories(cats)
      setArticles(arts)
      setBanner(bn)
      setBnTitle(bn.title)
      setBnSub(bn.subtitle)
    } catch (e) { console.error(e) }
  }

  async function loadStats() {
    try { const s = await getStatsSummary(); setStats(s) } catch (e) { console.error(e) }
  }

  function openNewArticle() {
    setEditing({ title: '', subtitle: '', category_id: categories[0]?.id || null, cover_image: '', content: '<p>เริ่มเขียนบทความที่นี่...</p>', ref_link: '', read_min: 3, status: 'draft', published_at: new Date().toISOString().split('T')[0] })
    setCoverFile(null)
  }

  async function handleSaveArticle() {
    if (!editing) return
    try {
      let coverUrl = editing.cover_image || ''
      if (coverFile) coverUrl = await uploadImage(coverFile, 'covers')
      await upsertArticle({ ...editing, cover_image: coverUrl })
      show(editing.id ? 'บันทึกแล้ว' : 'สร้างบทความใหม่แล้ว')
      setEditing(null)
      setCoverFile(null)
      setArticles(await getAllArticles())
    } catch (e: any) { show('Error: ' + e.message) }
  }

  async function handleDeleteArticle(id: number) {
    if (!confirm('ลบบทความนี้?')) return
    try {
      await deleteArticle(id)
      setArticles(p => p.filter(a => a.id !== id))
      show('ลบบทความแล้ว')
    } catch (e: any) { show('Error: ' + e.message) }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    try {
      await upsertCategory({ name: newCatName.trim().toUpperCase(), color: newCatColor, sort_order: categories.length + 1 })
      show('เพิ่มหมวดแล้ว')
      setNewCatName('')
      setCategories(await getCategories())
    } catch (e: any) { show('Error: ' + e.message) }
  }

  async function handleDeleteCategory(id: number) {
    if (articles.some(a => a.category_id === id)) { show('ไม่สามารถลบ — มีบทความอยู่'); return }
    try {
      await deleteCategory(id)
      setCategories(p => p.filter(c => c.id !== id))
      show('ลบหมวดหมู่แล้ว')
    } catch (e: any) { show('Error: ' + e.message) }
  }

  async function handleSaveBanner() {
    try {
      let imageUrl = banner?.image || ''
      if (bnFile) imageUrl = await uploadImage(bnFile, 'banner')
      await updateBanner({ title: bnTitle, subtitle: bnSub, image: imageUrl })
      setBanner(p => p ? { ...p, title: bnTitle, subtitle: bnSub, image: imageUrl } : p)
      setBnFile(null)
      show('บันทึก Banner แล้ว')
    } catch (e: any) { show('Error: ' + e.message) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">กำลังโหลด...</div>

  if (editing) {
    return (
      <div className="fixed inset-0 bg-slate-50 z-[200] overflow-y-auto max-w-[480px] mx-auto">
        <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
          <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <h3 className="flex-1 font-semibold">{editing.id ? 'แก้ไขบทความ' : 'บทความใหม่'}</h3>
          <button onClick={handleSaveArticle} className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold">บันทึก</button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">หัวข้อ</label>
            <input value={editing.title || ''} onChange={e => setEditing(p => ({ ...p!, title: e.target.value }))} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400" placeholder="ชื่อบทความ" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">หัวข้อรอง</label>
            <input value={editing.subtitle || ''} onChange={e => setEditing(p => ({ ...p!, subtitle: e.target.value }))} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400" placeholder="คำอธิบายสั้น ๆ" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">หมวดหมู่</label>
            <select value={editing.category_id || ''} onChange={e => setEditing(p => ({ ...p!, category_id: Number(e.target.value) }))} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400 bg-white">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">รูปปก</label>
            <ImageUpload value={editing.cover_image || ''} onChange={(url, file) => { setEditing(p => ({ ...p!, cover_image: url })); if (file) setCoverFile(file) }} label="อัปโหลดรูปปกบทความ" recWidth={1048} recHeight={1048} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">เวลาอ่าน (นาที)</label>
              <input type="number" min={1} max={60} value={editing.read_min || 3} onChange={e => setEditing(p => ({ ...p!, read_min: Number(e.target.value) }))} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">สถานะ</label>
              <select value={editing.status || 'draft'} onChange={e => setEditing(p => ({ ...p!, status: e.target.value as any }))} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400 bg-white">
                <option value="published">เผยแพร่</option>
                <option value="draft">แบบร่าง</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Link อ้างอิง</label>
            <input value={editing.ref_link || ''} onChange={e => setEditing(p => ({ ...p!, ref_link: e.target.value }))} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">เนื้อหา</label>
            <RichTextEditor value={editing.content || ''} onChange={html => setEditing(p => ({ ...p!, content: html }))} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <h2 className="font-display font-bold text-lg text-primary-dark">Admin</h2>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-semibold">ADMIN</span>
          <button onClick={async () => { await signOut(); router.replace('/') }} className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-red-500 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
          <button onClick={() => router.push('/')} className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </header>

      <div className="flex px-3 bg-white border-b border-slate-200">
        {(['articles', 'categories', 'banner', 'stats'] as const).map(t => (
          <button key={t} className={`px-3.5 py-3 text-sm font-medium border-b-2 transition ${tab === t ? 'text-primary border-primary font-semibold' : 'text-slate-400 border-transparent'}`} onClick={() => setTab(t)}>
            {{ articles: 'บทความ', categories: 'หมวดหมู่', banner: 'Banner', stats: 'สถิติ' }[t]}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'articles' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-500">{articles.length} บทความ</span>
              <button onClick={openNewArticle} className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold">+ เพิ่มบทความ</button>
            </div>
            {articles.map(a => {
              const cat = categories.find(c => c.id === a.category_id)
              return (
                <div key={a.id} className="flex items-center gap-3 p-3.5 bg-white rounded-lg border border-slate-200 mb-2.5">
                  <div className="w-1 h-10 rounded-sm" style={{ background: cat?.color || '#ccc' }} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{a.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{a.views} views · {a.read_min} min · {a.status === 'published' ? 'เผยแพร่' : 'แบบร่าง'}</p>
                  </div>
                  <button onClick={() => { setEditing({ ...a }); setCoverFile(null) }} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary transition text-xs">แก้</button>
                  <button onClick={() => handleDeleteArticle(a.id)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition text-xs">ลบ</button>
                </div>
              )
            })}
          </>
        )}

        {tab === 'categories' && (
          <>
            <div className="flex gap-2 mb-4">
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="ชื่อหมวดหมู่ใหม่" className="flex-1 px-3.5 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400" onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
              <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-11 h-11 border-2 border-slate-200 rounded-lg cursor-pointer p-1" />
              <button onClick={handleAddCategory} className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold">+ เพิ่ม</button>
            </div>
            {categories.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3.5 bg-white rounded-lg border border-slate-200 mb-2.5">
                <div className="w-3.5 h-3.5 rounded-full" style={{ background: c.color }} />
                <span className="flex-1 font-medium text-sm">{c.name}</span>
                <span className="text-xs text-slate-400">{articles.filter(a => a.category_id === c.id).length} บทความ</span>
                <button onClick={() => handleDeleteCategory(c.id)} className="text-slate-400 hover:text-red-500 transition text-xs">ลบ</button>
              </div>
            ))}
          </>
        )}

        {tab === 'banner' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-sm font-semibold mb-4">แก้ไข Banner หน้าแรก</h4>
            <div className="rounded-lg overflow-hidden relative h-28 bg-gradient-to-br from-primary-dark to-primary mb-4">
              {banner?.image && <img src={banner.image} alt="" className="w-full h-full object-cover opacity-50" />}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent text-white">
                <h3 className="font-bold">{bnTitle}</h3>
                <p className="text-xs opacity-85">{bnSub}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">รูป Banner</label>
                <ImageUpload value={banner?.image || ''} onChange={(url, file) => { setBanner(p => p ? { ...p, image: url } : p); if (file) setBnFile(file) }} label="อัปโหลดรูป Banner" recWidth={1048} recHeight={1048} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">หัวข้อ</label>
                <input value={bnTitle} onChange={e => setBnTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">หัวข้อรอง</label>
                <input value={bnSub} onChange={e => setBnSub(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400" />
              </div>
              <button onClick={handleSaveBanner} className="w-full py-3 bg-primary text-white rounded-lg text-sm font-semibold">บันทึก Banner</button>
            </div>
          </div>
        )}

        {tab === 'stats' && stats && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'บทความทั้งหมด', value: stats.total_articles },
                { label: 'ยอดเข้าชมรวม', value: Number(stats.total_views).toLocaleString() },
                { label: 'เฉลี่ย/บทความ', value: Math.round(stats.avg_views).toLocaleString() },
                { label: 'หมวดหมู่', value: stats.total_categories },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-400 font-medium uppercase">{s.label}</p>
                  <p className="font-display text-2xl font-bold text-primary-dark mt-1">{s.value}</p>
                </div>
              ))}
            </div>
            {stats.views_by_category && stats.views_by_category.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2.5 mb-2.5">
                <span className="w-24 text-xs text-slate-500 text-right truncate">{c.name}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden">
                  <div className="stats-bar h-full rounded-md" style={{ width: `${Math.max((c.total_views / (stats.views_by_category[0]?.total_views || 1)) * 100, 8)}%`, background: c.color }} />
                </div>
                <span className="text-xs font-semibold w-12">{Number(c.total_views).toLocaleString()}</span>
              </div>
            ))}
            {stats.top_articles && stats.top_articles.map((a: any, i: number) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 mb-2 mt-2">
                <span className="font-display text-lg font-bold text-primary w-7 text-center">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-semibold truncate">{a.title}</h5>
                  <span className="text-xs" style={{ color: a.category_color }}>{a.category_name}</span>
                </div>
                <span className="text-sm font-bold text-primary">{a.views.toLocaleString()}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}

export default function AdminPage() {
  return <ToastProvider><AdminInner /></ToastProvider>
}
