import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Category = {
  id: number
  name: string
  color: string
  sort_order: number
  created_at: string
}

export type Article = {
  id: number
  title: string
  subtitle: string
  category_id: number | null
  cover_image: string
  content: string
  ref_link: string
  read_min: number
  views: number
  status: 'draft' | 'published'
  published_at: string
  created_at: string
  updated_at: string
  categories?: Category
}

export type BannerSettings = {
  id: number
  title: string
  subtitle: string
  image: string
  updated_at: string
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as Category[]
}

export async function getPublishedArticles(categoryId?: number) {
  let q = supabase
    .from('articles')
    .select('*, categories(*)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (categoryId) q = q.eq('category_id', categoryId)
  const { data, error } = await q
  if (error) throw error
  return data as Article[]
}

export async function getAllArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Article[]
}

export async function getArticleById(id: number) {
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Article
}

export async function incrementView(articleId: number) {
  await supabase.rpc('increment_view', {
    p_article_id: articleId,
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    p_referrer: typeof document !== 'undefined' ? document.referrer : '',
  })
}

export async function upsertArticle(article: Partial<Article>) {
  const { data, error } = await supabase
    .from('articles')
    .upsert(article)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteArticle(id: number) {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
}

export async function upsertCategory(cat: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .upsert(cat)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: number) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function getBanner() {
  const { data, error } = await supabase
    .from('banner_settings')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data as BannerSettings
}

export async function updateBanner(banner: Partial<BannerSettings>) {
  const { data, error } = await supabase
    .from('banner_settings')
    .update(banner)
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getStatsSummary() {
  const { data, error } = await supabase.rpc('get_stats_summary')
  if (error) throw error
  return data
}

export async function uploadImage(file: File, folder: string = 'articles') {
  const ext = file.name.split('.').pop()
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from('images')
    .upload(name, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
