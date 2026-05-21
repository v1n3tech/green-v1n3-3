import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedClient } from './feed-client'

export const metadata = {
  title: 'Feed | GreenV1n3 Dashboard',
  description: 'Stay updated with the latest news, articles and announcements from the GreenV1n3 community.',
}

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, community, display_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  // Fetch published articles
  const { data: articles } = await supabase
    .from('news_articles')
    .select(`
      id,
      title,
      slug,
      excerpt,
      content,
      featured_image,
      tags,
      status,
      is_featured,
      is_breaking,
      views_count,
      likes_count,
      comments_count,
      published_at,
      created_at,
      category:news_categories(id, name, slug, type, color),
      author:profiles!news_articles_author_id_fkey(id, display_name, first_name, last_name, role)
    `)
    .eq('status', 'published')
    .order('is_breaking', { ascending: false })
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(50)

  // Fetch categories for filters
  const { data: categories } = await supabase
    .from('news_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <FeedClient
      profile={{
        id: profile.id,
        role: profile.role,
        community: profile.community,
        displayName: profile.display_name || 'User',
      }}
      initialArticles={(articles || []) as never[]}
      categories={categories || []}
    />
  )
}
