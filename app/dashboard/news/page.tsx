import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewsManagement } from './news-management'

export default async function DashboardNewsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user profile to check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, community, display_name, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  // Check if user can manage news
  const canManageNews = 
    profile.role === 'admin' ||
    profile.role === 'scc_member' ||
    profile.role === 'lgpa' ||
    profile.role === 'gcm' ||
    (profile.role === 'agro_executive' && profile.community === 'agro_media_branding')

  // Fetch categories for the form
  const { data: categories } = await supabase
    .from('news_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  // Fetch user's articles (or all if admin/manager)
  let articlesQuery = supabase
    .from('news_articles')
    .select(`
      *,
      category:news_categories(id, name, slug, type, color),
      author:profiles(id, display_name, first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  // Non-admins only see their own articles
  if (!['admin', 'scc_member', 'lgpa'].includes(profile.role || '')) {
    articlesQuery = articlesQuery.eq('author_id', user.id)
  }

  const { data: articles } = await articlesQuery.limit(50)

  return (
    <NewsManagement
      profile={{
        id: profile.id,
        role: profile.role,
        community: profile.community,
        displayName: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
      }}
      canManageNews={canManageNews}
      categories={categories || []}
      initialArticles={articles || []}
    />
  )
}

export const metadata = {
  title: 'News Studio | GreenV1n3 Dashboard',
  description: 'Create, edit, and publish news articles for the GreenV1n3 platform',
}
