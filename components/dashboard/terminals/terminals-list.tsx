"use client"

import { MapPin, Loader2, Power } from "lucide-react"
import { MarketplaceTerminal, CreateTerminalInput } from "@/lib/fulfillment/types"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createTerminal, updateTerminal, deleteTerminal, toggleTerminalActive } from "@/lib/fulfillment/terminals"

interface TerminalsListProps {
  terminals: MarketplaceTerminal[]
  canManage: boolean
}

const inputCls =
  "w-full bg-background border border-border rounded-[2px] px-2.5 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-primary"
const labelCls = "text-[9px] text-muted-foreground tracking-wider mb-1 block uppercase"

const EMPTY: CreateTerminalInput = {
  name: "",
  state: "Plateau",
  lga: "",
  address: "",
  contact_name: "",
  contact_phone: "",
}

export function TerminalsList({ terminals, canManage }: TerminalsListProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateTerminalInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setForm(EMPTY)
    setEditingId(null)
    setShowForm(true)
    setError(null)
  }

  function openEdit(t: MarketplaceTerminal) {
    setForm({
      name: t.name,
      state: t.state,
      lga: t.lga,
      address: t.address,
      contact_name: t.contact_name ?? "",
      contact_phone: t.contact_phone ?? "",
    })
    setEditingId(t.id)
    setShowForm(true)
    setError(null)
  }

  function close() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY)
    setError(null)
  }

  function save() {
    if (!form.name || !form.lga || !form.address) {
      setError("Name, LGA and address are required")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = editingId ? await updateTerminal(editingId, form) : await createTerminal(form)
      if (res.error) {
        setError(res.error)
        return
      }
      close()
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteTerminal(id)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function toggle(id: string, next: boolean) {
    startTransition(async () => {
      const res = await toggleTerminalActive(id, next)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {terminals.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {terminals.map((t) => (
            <div
              key={t.id}
              className={`p-2.5 border rounded-[2px] text-[10px] transition-colors ${
                t.is_active ? "bg-secondary/30 border-border hover:border-primary/30" : "bg-secondary/10 border-border/50 opacity-60"
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] border border-border bg-background text-primary">
                  <MapPin className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground truncate">{t.name}</p>
                    <span
                      className={`mono-xs shrink-0 rounded-[2px] border px-1.5 py-0.5 text-[8px] ${
                        t.is_active
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      {t.is_active ? "ACTIVE" : "OFF"}
                    </span>
                  </div>
                  <p className="mono-xs text-[9px] text-muted-foreground mt-0.5">
                    {t.lga}, {t.state}
                  </p>
                </div>
              </div>
              {canManage && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    onClick={() => openEdit(t)}
                    className="px-2 py-1 text-[9px] bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => toggle(t.id, !t.is_active)}
                    disabled={pending}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] bg-secondary text-muted-foreground rounded hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <Power className="w-2.5 h-2.5" />
                    {t.is_active ? "DISABLE" : "ENABLE"}
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    disabled={pending}
                    className="px-2 py-1 text-[9px] bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors disabled:opacity-50"
                  >
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

      {canManage && !showForm && (
        <button
          onClick={openCreate}
          className="w-full py-2 border border-primary text-primary rounded-[2px] text-[10px] hover:bg-primary/10 transition-colors"
        >
          + NEW TERMINAL
        </button>
      )}

      {canManage && showForm && (
        <div className="p-3 border border-border rounded-[2px] bg-secondary/20 space-y-2">
          <p className="text-[10px] text-foreground uppercase tracking-wider">
            {editingId ? "Edit terminal" : "New terminal"}
          </p>
          <div>
            <span className={labelCls}>Name</span>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Jos Central Terminal"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={labelCls}>State</span>
              <input className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <span className={labelCls}>LGA</span>
              <input className={inputCls} value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} />
            </div>
          </div>
          <div>
            <span className={labelCls}>Address</span>
            <input
              className={inputCls}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street, landmark"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={labelCls}>Contact name</span>
              <input
                className={inputCls}
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div>
              <span className={labelCls}>Contact phone</span>
              <input
                className={inputCls}
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="text-[10px] text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={save}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-[2px] text-[10px] disabled:opacity-50"
            >
              {pending && <Loader2 className="w-3 h-3 animate-spin" />}
              {editingId ? "Save changes" : "Create terminal"}
            </button>
            <button onClick={close} className="px-3 py-1.5 text-[10px] text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
