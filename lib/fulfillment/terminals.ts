import { createClient } from "@/lib/supabase/server"
import { MarketplaceTerminal, CreateTerminalInput } from "./types"

export async function fetchTerminals(onlyActive = true): Promise<{
  terminals: MarketplaceTerminal[]
  error: string | null
}> {
  const supabase = await createClient()
  const query = supabase.from("marketplace_terminals").select("*")

  if (onlyActive) {
    query.eq("is_active", true)
  }

  const { data, error } = await query.order("updated_at", { ascending: false })

  if (error) return { terminals: [], error: error.message }
  return { terminals: (data || []) as MarketplaceTerminal[], error: null }
}

export async function createTerminal(input: CreateTerminalInput): Promise<{
  terminal: MarketplaceTerminal | null
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { terminal: null, error: "Unauthorized" }

  const { data, error } = await supabase
    .from("marketplace_terminals")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { terminal: null, error: error.message }
  return { terminal: data as MarketplaceTerminal, error: null }
}

export async function updateTerminal(
  terminalId: string,
  updates: Partial<CreateTerminalInput>
): Promise<{
  terminal: MarketplaceTerminal | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("marketplace_terminals")
    .update(updates)
    .eq("id", terminalId)
    .select()
    .single()

  if (error) return { terminal: null, error: error.message }
  return { terminal: data as MarketplaceTerminal, error: null }
}

export async function deleteTerminal(terminalId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()

  const { error } = await supabase.from("marketplace_terminals").delete().eq("id", terminalId)

  if (error) return { success: false, error: error.message }
  return { success: true, error: null }
}

export async function toggleTerminalActive(terminalId: string, isActive: boolean): Promise<{
  terminal: MarketplaceTerminal | null
  error: string | null
}> {
  return updateTerminal(terminalId, { is_active: isActive })
}
