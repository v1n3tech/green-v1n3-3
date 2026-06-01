'use client'

import { useState } from 'react'
import { Truck, MapPin } from 'lucide-react'

export function FulfillmentSelector({
  onSelect,
  defaultValue = 'pickup',
}: {
  onSelect: (method: 'pickup' | 'delivery') => void
  defaultValue?: 'pickup' | 'delivery'
}) {
  const [selected, setSelected] = useState<'pickup' | 'delivery'>(defaultValue)

  const handleSelect = (method: 'pickup' | 'delivery') => {
    setSelected(method)
    onSelect(method)
  }

  return (
    <div className="flex flex-col gap-3 p-4 border border-border rounded-[2px] bg-secondary/20">
      <p className="mono-xs text-[10px] text-muted-foreground uppercase">Fulfillment</p>
      <div className="flex gap-3">
        <button
          onClick={() => handleSelect('pickup')}
          className={`flex-1 flex items-center gap-2 p-3 rounded-[2px] border transition-colors ${
            selected === 'pickup'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-background border-border text-foreground hover:border-primary/40'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span className="mono-xs text-[10px]">PICKUP</span>
        </button>
        <button
          onClick={() => handleSelect('delivery')}
          className={`flex-1 flex items-center gap-2 p-3 rounded-[2px] border transition-colors ${
            selected === 'delivery'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-background border-border text-foreground hover:border-primary/40'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span className="mono-xs text-[10px]">DELIVERY</span>
        </button>
      </div>
    </div>
  )
}
