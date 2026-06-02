export interface MarketplaceTerminal {
  id: string
  name: string
  state: string
  lga: string
  address: string
  contact_name: string | null
  contact_phone: string | null
  notes: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DeliveryRequest {
  id: string
  order_id: string
  seller_id: string | null
  logistics_gcm_id: string | null
  assigned_executive_id: string | null
  status: "pending" | "accepted" | "scheduled" | "in_transit" | "delivered" | "failed" | "rejected" | "cancelled"
  pickup_terminal_id: string | null
  delivery_address: string | null
  delivery_state: string | null
  delivery_lga: string | null
  delivery_contact_phone: string | null
  notes: string | null
  logistics_response: string | null
  scheduled_delivery_at: string | null
  requested_at: string
  accepted_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  // Joined
  order?: any
  pickup_terminal?: MarketplaceTerminal
  assigned_executive?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface CreateTerminalInput {
  name: string
  state: string
  lga: string
  address: string
  contact_name?: string
  contact_phone?: string
  notes?: string
  is_active?: boolean
}

export interface CreateDeliveryRequestInput {
  order_id: string
  delivery_address: string
  delivery_state: string
  delivery_lga: string
  delivery_contact_phone: string
  notes?: string
  pickup_terminal_id?: string
}
