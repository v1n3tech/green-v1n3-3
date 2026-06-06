"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Sparkles,
  Send,
  Loader2,
  CloudSun,
  TrendingUp,
  MapPin,
  AlertCircle,
  Leaf,
} from "lucide-react"
import { Markdown } from "@/components/ai/markdown"
import { cn } from "@/lib/utils"

const STARTERS = [
  { icon: CloudSun, text: "What's the weather outlook for planting maize this week?" },
  { icon: TrendingUp, text: "What are the current commodity prices on the platform?" },
  { icon: MapPin, text: "Which LGAs have had the best rainfall recently for a rain-fed crop?" },
  { icon: Leaf, text: "What grows well in my area this season?" },
]

function partsToText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("")
}

export function AdvisorChat({ disclaimer }: { disclaimer: string }) {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/advisory" }),
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const busy = status === "streaming" || status === "submitted"

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status])

  function submit(text: string) {
    const value = text.trim()
    if (!value || busy) return
    sendMessage({ text: value })
    setInput("")
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col rounded-[2px] border border-border bg-card/30">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-[2px] bg-primary/15">
          <Sparkles className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-foreground">Farmer Advisor</h2>
          <p className="mono-xs truncate text-[10px] text-muted-foreground">
            Grounded in real weather + platform prices
          </p>
        </div>
        <span className="ml-auto mono-xs rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
          GEMINI
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-lg pt-6 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Leaf className="size-6 text-primary" />
            </div>
            <h3 className="text-balance text-lg font-medium text-foreground">
              Ask about crops, weather, prices and the platform
            </h3>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              I use live Plateau weather and the platform&apos;s recorded prices — I won&apos;t make up numbers.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STARTERS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => submit(s.text)}
                  className="flex items-start gap-2 rounded-[2px] border border-border bg-card/50 p-3 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-card"
                >
                  <s.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="leading-snug">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const text = partsToText(m.parts as { type: string; text?: string }[])
            const toolParts = (m.parts as { type: string }[]).filter((p) =>
              p.type.startsWith("tool-"),
            )
            return (
              <div
                key={m.id}
                className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "assistant" && (
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[2px] bg-primary/15">
                    <Sparkles className="size-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-[2px] px-3 py-2",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card",
                  )}
                >
                  {m.role === "assistant" && toolParts.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {toolParts.map((tp, i) => (
                        <span
                          key={i}
                          className="mono-xs inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground"
                        >
                          <CloudSun className="size-3" />
                          {tp.type.replace("tool-", "")}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
                  ) : text ? (
                    <Markdown>{text}</Markdown>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" /> Thinking…
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-[2px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error.message || "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(input)
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit(input)
              }
            }}
            rows={1}
            placeholder="Ask about crops, weather, prices…"
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-[2px] border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex size-[42px] shrink-0 items-center justify-center rounded-[2px] bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted-foreground">{disclaimer}</p>
      </div>
    </div>
  )
}
