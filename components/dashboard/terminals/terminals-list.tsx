'use client'

import { MapPin } from 'lucide-react'
import { MarketplaceTerminal } from '@/lib/fulfillment/types'
import { useState } from 'react'

interface TerminalsListProps {
  terminals: MarketplaceTerminal[]
  canManage: boolean
}

export function TerminalsList({ terminals, canManage }: TerminalsListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {terminals.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {terminals.map((t) => (
            <div
              key={t.id}
              className={`p-2 border rounded-[2px] text-[10px] ${
                t.is_active ? 'bg-secondary/30 border-border' : 'bg-secondary/10 border-border/50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{t.name}</p>
                  <p className="text-muted-foreground">{t.lga}, {t.state}</p>
                </div>
              </div>
              {canManage && (
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => setEditingId(t.id)}
                    className="px-2 py-1 text-[9px] bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
                  >
                    EDIT
                  </button>
                  <button className="px-2 py-1 text-[9px] bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors">
                    DELETE
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-[10px]">No terminals yet.</p>
      )}

      {canManage && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-2 border border-primary text-primary rounded-[2px] text-[10px] mono-xs hover:bg-primary/10 transition-colors"
        >
          + NEW TERMINAL
        </button>
      )}
    </div>
  )
}
