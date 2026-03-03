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
      <div clas
