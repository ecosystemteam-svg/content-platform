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
    let session = await getSession()
    if (!session) {
      await new Promise(r => setTimeout(r, 1000))
      session = await getSession()
    }
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
      await upsertArticle({ ...editing, cover_image: coverU
