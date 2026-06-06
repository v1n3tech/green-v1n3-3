"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { MessageCircle, X, Send, Loader2, LifeBuoy, AlertCircle } from "lucide-react"
import { Markdown } from "@/components/ai/markdown"
import { cn } from "@/lib/utils"

const STARTERS = [
  "How do I get verified?",
  "What is the V1N3 token used for?",
  "How does the marketplace work?",
  "How do I top up my wallet?",
]

function partsToText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("")
}

export function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/support" }),
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const busy = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status, open])

  function submit(text: string) {
    const value = text.trim()
    if (!value || busy) return
    sendMessage({ text: value })
    setInput("")
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close help assistant" : "Open help assistant"}
        className="fixed bottom-5 right-5 z-50 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105"
        style={{ width: 52, height: 52 }}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[min(560px,calc(100vh-7rem))] w-[min(384px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[4px] border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-border bg-secondary/40 px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-[2px] bg-primary/15">
              <LifeBuoy className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-foreground">Help & Support</h2>
              <p className="mono-xs text-[10px] text-muted-foreground">Answers from the GreenV1n3 docs</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <div className="pt-2">
                <p className="px-1 text-sm leading-relaxed text-muted-foreground">
                  Hi! I can help you understand GreenV1n3 — accounts, the wallet, V1N3 token, marketplace,
                  delivery and more. Ask me anything.
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="rounded-[2px] border border-border bg-secondary/40 px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const text = partsToText(m.parts as { type: string; text?: string }[])
                return (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-[2px] px-3 py-2 text-sm",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-secondary/40",
                      )}
                    >
                      {m.role === "user" ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
                      ) : text ? (
                        <Markdown>{text}</Markdown>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="size-3.5 animate-spin" /> Thinking…
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-[2px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {error.message || "Something went wrong."}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit(input)
            }}
            className="flex items-end gap-2 border-t border-border p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              className="h-10 flex-1 rounded-[2px] border border-border bg-secondary/40 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="flex size-10 shrink-0 items-center justify-center rounded-[2px] bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
