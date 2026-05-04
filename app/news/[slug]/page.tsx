import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArticleContent } from './article-content'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch article with author and category
  const { data: article, error } = await supabase
    .from('news_articles')
    .select(`
      *,
      category:news_categories(*),
      author:profiles(id, display_name, first_name, last_name, avatar_url, community, role)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !article) {
    notFound()
  }

  // Increment view count
  await supabase.rpc('increment_article_views', { article_id: article.id })

  // Fetch related articles from same category
  const { data: relatedArticles } = await supabase
    .from('news_articles')
    .select(`
      id, title, slug, excerpt, thumbnail, featured_image, published_at, views_count,
      category:news_categories(name, type, color)
    `)
    .eq('status', 'published')
    .eq('category_id', article.category_id)
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3)

  return <ArticleContent article={article} relatedArticles={relatedArticles || []} />
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('news_articles')
    .select('title, excerpt, meta_title, meta_description, featured_image')
    .eq('slug', slug)
    .single()

  if (!article) {
    return { title: 'Article Not Found' }
  }

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      images: article.featured_image ? [article.featured_image] : [],
    },
  }
}
