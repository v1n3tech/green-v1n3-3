"use client"

import { Streamdown } from "streamdown"
import { cn } from "@/lib/utils"

/**
 * Shared markdown renderer used by the docs help center and every AI surface
 * (advisory chat, support bot, news previews). Themed to match the GreenV1n3
 * dark terminal aesthetic.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <Streamdown
      className={cn(
        "text-sm leading-relaxed text-foreground/90",
        "[&_p]:my-2 [&_p]:leading-relaxed",
        "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-medium [&_h1]:text-foreground",
        "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-foreground",
        "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-primary",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-1",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_strong]:font-medium [&_strong]:text-foreground",
        "[&_code]:rounded-[2px] [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
        "[&_pre]:my-3 [&_pre]:rounded-[2px] [&_pre]:border [&_pre]:border-border [&_pre]:bg-secondary [&_pre]:p-3",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:p-2",
        className,
      )}
    >
      {children}
    </Streamdown>
  )
}
