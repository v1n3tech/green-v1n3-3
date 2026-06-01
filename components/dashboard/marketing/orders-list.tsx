'use client'

interface OrdersListProps {
  orders: any[]
}

export function OrdersList({ orders }: OrdersListProps) {
  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      {orders && orders.length > 0 ? (
        orders.map((order) => (
          <div key={order.id} className="p-3 border border-border rounded-[2px] bg-secondary/30">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="mono-xs text-[10px] text-foreground font-medium truncate">
                  {order.product_title}
                </p>
                <p className="mono-xs text-[9px] text-muted-foreground">
                  {order.buyer?.display_name ?? 'Buyer'} →{' '}
                  {order.seller?.display_name ?? 'Seller'}
                </p>
              </div>
              <span className="mono-xs text-[8px] text-primary flex-shrink-0">
                {order.fulfillment_method?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="mono-xs text-[9px] text-muted-foreground">
                {order.v1n3_amount} V1N3
              </p>
              <span
                className={`mono-xs text-[8px] px-1.5 py-0.5 rounded text-foreground ${
                  order.fulfillment_status === 'pending'
                    ? 'bg-yellow-500/20'
                    : order.fulfillment_status === 'pending'
                    ? 'bg-blue-500/20'
                    : 'bg-green-500/20'
                }`}
              >
                {order.fulfillment_status?.toUpperCase()}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground text-[10px]">No orders yet.</p>
      )}
    </div>
  )
}
