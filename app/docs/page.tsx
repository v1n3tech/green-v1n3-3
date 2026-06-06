import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { DocsBrowser, type DocArticle } from "@/components/docs/docs-browser"

export const metadata: Metadata = {
  title: "Help Center & Docs | GreenV1n3",
  description:
    "Learn how GreenV1n3 works — accounts, agro communities, the V1N3 wallet and token, the marketplace, delivery, governance and security.",
}

export const dynamic = "force-dynamic"

export default async function DocsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("knowledge_base")
    .select("id, slug, title, category, summary, content, keywords, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })

  const articles: DocArticle[] = (data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category,
    summary: a.summary,
    content: a.content,
    keywords: a.keywords ?? [],
  }))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <DocsBrowser articles={articles} />
      </main>
      <Footer />
    </div>
  )
}
