// Client-safe helper that calls the on-chain checkout API route.
// Used by both the product detail "Buy Now" flow and the cart checkout.

export interface CheckoutResult {
  success: boolean
  error?: string
  orders?: Array<{ id: string; signature: string; title: string }>
  totalNgn?: number
  totalV1n3?: number
  partial?: boolean
  failures?: Array<{ seller: string; error: string }>
  balance?: number
  required?: number
}

export async function runCheckout(payload: {
  buyNow?: { productId: string; quantity: number }
  memo?: string
}): Promise<CheckoutResult> {
  try {
    const res = await fetch("/api/marketplace/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) {
      return {
        success: false,
        error: json.error ?? "Checkout failed",
        balance: json.balance,
        required: json.required,
        failures: json.failures,
      }
    }
    return json as CheckoutResult
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Network error" }
  }
}
