import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArticleView } from './article-view'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('news_articles')
    .select('title, excerpt, featured_image')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) {
    return { title: 'Article Not Found | GreenV1n3' }
  }

  return {
    title: `${article.title} | GreenV1n3 Feed`,
    description: article.excerpt || 'Read this article on GreenV1n3',
    openGraph: {
      title: article.title,
      description: article.excerpt || 'Read this article on GreenV1n3',
      images: article.featured_image ? [article.featured_image] : [],
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, display_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  // Fetch the article
  const { data: article } = await supabase
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
      social_links,
      category:news_categories(id, name, slug, type, color),
      author:profiles!news_articles_author_id_fkey(id, display_name, first_name, last_name, role, photo_url)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) notFound()

  // Increment view count
  await supabase
    .from('news_articles')
    .update({ views_count: article.views_count + 1 })
    .eq('id', article.id)

  // Fetch related articles from same category
  const { data: relatedArticles } = await supabase
    .from('news_articles')
    .select(`
      id, title, slug, excerpt, featured_image, published_at,
      category:news_categories(id, name, color)
    `)
    .eq('status', 'published')
    .eq('category_id', (article.category as unknown as { id: string } | null)?.id || '')
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3)

  return (
    <ArticleView
      article={article as never}
      relatedArticles={(relatedArticles || []) as never[]}
      currentUserId={profile.id}
    />
  )
}
