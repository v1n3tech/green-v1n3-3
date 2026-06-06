"use client"

import { useMemo, useState } from "react"
import {
  Search,
  BookOpen,
  Rocket,
  Landmark,
  Wallet,
  Coins,
  ShoppingCart,
  Truck,
  ShieldCheck,
  HelpCircle,
  FileText,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"
import { Markdown } from "@/components/ai/markdown"
import { cn } from "@/lib/utils"

export type DocArticle = {
  id: string
  slug: string
  title: string
  category: string
  summary: string | null
  content: string
  keywords: string[]
}

const CATEGORY_META: Record<string, { label: string; icon: typeof BookOpen }> = {
  getting_started: { label: "Getting Started", icon: Rocket },
  governance: { label: "Roles & Governance", icon: Landmark },
  wallet: { label: "Wallet", icon: Wallet },
  token: { label: "V1N3 Token", icon: Coins },
  marketplace: { label: "Marketplace", icon: ShoppingCart },
  logistics: { label: "Delivery & Logistics", icon: Truck },
  security: { label: "Security", icon: ShieldCheck },
  faq: { label: "Help & FAQ", icon: HelpCircle },
  general: { label: "General", icon: FileText },
}

function categoryLabel(cat: string) {
  return CATEGORY_META[cat]?.label ?? cat
}
function categoryIcon(cat: string) {
  return CATEGORY_META[cat]?.icon ?? FileText
}

export function DocsBrowser({ articles }: { articles: DocArticle[] }) {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  const categories = useMemo(() => {
    const set = new Set(articles.map((a) => a.category))
    return Array.from(set)
  }, [articles])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles.filter((a) => {
      const matchesCat = activeCategory === "all" || a.category === activeCategory
      if (!matchesCat) return false
      if (!q) return true
      return (
        a.title.toLowerCase().includes(q) ||
        (a.summary ?? "").toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.toLowerCase().includes(q))
      )
    })
  }, [articles, query, activeCategory])

  const activeArticle = useMemo(
    () => articles.find((a) => a.slug === activeSlug) ?? null,
    [articles, activeSlug],
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Masthead */}
      <div className="mb-8 border-b border-border pb-6">
        <p className="mono-xs mb-2 text-primary">{"// HELP CENTER"}</p>
        <h1 className="text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          GreenV1n3 Docs
        </h1>
        <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Everything you need to know about the platform — accounts, agro communities, your V1N3 wallet
          and token, the marketplace, delivery, governance and staying safe.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveSlug(null)
              }}
              placeholder="Search docs..."
              className="w-full rounded-[2px] border border-border bg-card/50 py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
            />
          </div>
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => {
                setActiveCategory("all")
                setActiveSlug(null)
              }}
              className={cn(
                "flex items-center gap-2 rounded-[2px] px-3 py-2 text-left text-sm transition-colors",
                activeCategory === "all"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <BookOpen className="size-4" />
              All Topics
            </button>
            {categories.map((cat) => {
              const Icon = categoryIcon(cat)
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat)
                    setActiveSlug(null)
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-[2px] px-3 py-2 text-left text-sm transition-colors",
                    activeCategory === cat
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {categoryLabel(cat)}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <section className="min-w-0">
          {activeArticle ? (
            <article>
              <button
                onClick={() => setActiveSlug(null)}
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="size-4" />
                Back to all
              </button>
              <p className="mono-xs mb-2 text-primary">{categoryLabel(activeArticle.category)}</p>
              <h2 className="mb-4 text-balance text-2xl font-medium text-foreground">
                {activeArticle.title}
              </h2>
              <Markdown>{activeArticle.content}</Markdown>
            </article>
          ) : filtered.length === 0 ? (
            <div className="rounded-[2px] border border-border bg-card/40 p-10 text-center">
              <HelpCircle className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-foreground">No articles match your search.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different term, or ask the assistant in the chat bubble.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map((a) => {
                const Icon = categoryIcon(a.category)
                return (
                  <button
                    key={a.id}
                    onClick={() => setActiveSlug(a.slug)}
                    className="group flex flex-col rounded-[2px] border border-border bg-card/40 p-4 text-left transition-colors hover:border-primary/50 hover:bg-card/70"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="size-4 text-primary" />
                      <span className="mono-xs text-muted-foreground">{categoryLabel(a.category)}</span>
                    </div>
                    <h3 className="mb-1 font-medium text-foreground">{a.title}</h3>
                    {a.summary ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {a.summary}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Read <ChevronRight className="size-3.5" />
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
