"use client"

import { useState } from "react"
import { Sparkles, Wand2, FileText, Tags, Languages, Loader2, Check, AlertCircle, ChevronDown } from "lucide-react"
import { TRANSLATION_LANGUAGES, type LanguageCode } from "@/lib/ai/prompts"

type Props = {
  title: string
  excerpt: string
  content: string
  category?: string
  onApplyContent: (html: string) => void
  onApplyExcerpt: (text: string) => void
  onApplyTags: (csv: string) => void
}

type Busy = null | "draft" | "improve" | "excerpt" | "tags" | "translate"

export function NewsAiPanel({
  title,
  excerpt,
  content,
  category,
  onApplyContent,
  onApplyExcerpt,
  onApplyTags,
}: Props) {
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [language, setLanguage] = useState<LanguageCode>("ha")

  async function run(action: Busy, extra?: Record<string, unknown>) {
    if (!action || busy) return
    setBusy(action)
    setError(null)
    setDone(null)
    try {
      const res = await fetch("/api/ai/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, title, excerpt, content, category, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")

      const result: string = data.result
      if (action === "draft" || action === "improve" || action === "translate") {
        onApplyContent(result)
      } else if (action === "excerpt") {
        onApplyExcerpt(result)
      } else if (action === "tags") {
        onApplyTags(result)
      }
      setDone(action)
      setTimeout(() => setDone(null), 2500)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const btn =
    "inline-flex items-center gap-1.5 mono-xs px-3 py-2 rounded-[2px] border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <div className="rounded-[2px] border border-primary/30 bg-gradient-to-br from-primary/[0.07] to-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="mono-xs font-medium text-foreground">AI ASSISTANT</h3>
        <span className="mono-xs rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">GEMINI</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => run("draft")}
          disabled={!!busy}
          className={`${btn} border-primary/40 bg-primary/10 text-primary hover:bg-primary/20`}
          title="Draft a full article from the title/topic"
        >
          {busy === "draft" ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
          Draft from title
        </button>

        <button
          type="button"
          onClick={() => run("improve")}
          disabled={!!busy}
          className={`${btn} border-border bg-secondary/50 text-foreground hover:border-primary/40`}
          title="Polish grammar, clarity and structure"
        >
          {busy === "improve" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          Improve
        </button>

        <button
          type="button"
          onClick={() => run("excerpt")}
          disabled={!!busy}
          className={`${btn} border-border bg-secondary/50 text-foreground hover:border-primary/40`}
          title="Generate a summary excerpt"
        >
          {busy === "excerpt" ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
          Excerpt
        </button>

        <button
          type="button"
          onClick={() => run("tags")}
          disabled={!!busy}
          className={`${btn} border-border bg-secondary/50 text-foreground hover:border-primary/40`}
          title="Suggest tags"
        >
          {busy === "tags" ? <Loader2 className="size-3.5 animate-spin" /> : <Tags className="size-3.5" />}
          Tags
        </button>

        <div className="flex items-center gap-1">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="appearance-none rounded-[2px] border border-border bg-secondary/50 py-2 pl-2 pr-7 mono-xs text-foreground outline-none focus:border-primary/40"
            >
              {TRANSLATION_LANGUAGES.filter((l) => l.code !== "en").map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                  {"beta" in l && l.beta ? " (beta)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          <button
            type="button"
            onClick={() => run("translate", { language })}
            disabled={!!busy}
            className={`${btn} border-border bg-secondary/50 text-foreground hover:border-primary/40`}
            title="Translate the content (replaces editor content)"
          >
            {busy === "translate" ? <Loader2 className="size-3.5 animate-spin" /> : <Languages className="size-3.5" />}
            Translate
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      ) : done ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
          <Check className="size-3.5" />
          {done === "draft" || done === "improve" || done === "translate"
            ? "Applied to the content editor."
            : done === "excerpt"
              ? "Excerpt applied."
              : "Tags applied."}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          AI drafts are starting points — review and verify any facts or figures before publishing. Translation
          replaces the editor content.
        </p>
      )}
    </div>
  )
}
