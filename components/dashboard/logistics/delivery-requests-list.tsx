'use client'

import { useState } from 'react'
import { DeliveryRequest } from '@/lib/fulfillment/types'
import { acceptDeliveryRequest, scheduleDelivery } from '@/lib/fulfillment/delivery'
import { Truck, Calendar } from 'lucide-react'

interface DeliveryRequestsListProps {
  requests: DeliveryRequest[]
  isGcm: boolean
}

export function DeliveryRequestsList({ requests, isGcm }: DeliveryRequestsListProps) {
  const [accepting, setAccepting] = useState<string | null>(null)
  const [scheduling, setScheduling] = useState<string | null>(null)
  const [scheduledDate, setScheduledDate] = useState<string>('')

  const handleAccept = async (requestId: string) => {
    if (!isGcm) return
    setAccepting(requestId)
    try {
      const { error } = await acceptDeliveryRequest(requestId)
      if (!error) {
        // Refetch or show success
        setAccepting(null)
      }
    } catch (e) {
      console.error('[v0] accept error:', e)
      setAccepting(null)
    }
  }

  const handleSchedule = async (requestId: string) => {
    if (!scheduledDate || !isGcm) return
    setScheduling(requestId)
    try {
      const { error } = await scheduleDelivery(requestId, scheduledDate)
      if (!error) {
        setScheduling(null)
        setScheduledDate('')
      }
    } catch (e) {
      console.error('[v0] schedule error:', e)
      setScheduling(null)
    }
  }

  return (
    <div className="space-y-3 max-h-[800px] overflow-y-auto">
      {requests && requests.length > 0 ? (
        requests.map((req) => (
          <div key={req.id} className="p-4 border border-border rounded-[2px] bg-secondary/30 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="mono-xs text-[11px] text-foreground font-medium">Order {req.order_id?.slice(0, 8)}</p>
                <span className={`mono-xs text-[9px] px-1.5 py-0.5 rounded ${
                  req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' : 'bg-blue-500/20 text-blue-700'
                }`}>
                  {req.status?.toUpperCase()}
                </span>
              </div>
              <p className="mono-xs text-[10px] text-muted-foreground">
                📍 {req.delivery_lga}, {req.delivery_state}
              </p>
              {req.delivery_contact_phone && (
                <p className="mono-xs text-[10px] text-muted-foreground">
                  📞 {req.delivery_contact_phone}
                </p>
              )}
            </div>

            {isGcm && req.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(req.id)}
                  disabled={accepting === req.id}
                  className="flex-1 px-3 py-2 bg-primary/20 text-primary text-[10px] mono-xs rounded hover:bg-primary/30 disabled:opacity-50 transition-colors"
                >
                  {accepting === req.id ? 'ACCEPTING...' : 'ACCEPT'}
                </button>
              </div>
            )}

            {isGcm && req.status === 'accepted' && !req.scheduled_delivery_at && (
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-[10px] bg-background border border-border rounded"
                />
                <button
                  onClick={() => handleSchedule(req.id)}
                  disabled={scheduling === req.id || !scheduledDate}
                  className="px-3 py-1.5 bg-primary text-background text-[10px] mono-xs rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {scheduling === req.id ? '...' : 'SCHEDULE'}
                </button>
              </div>
            )}

            {req.scheduled_delivery_at && (
              <p className="mono-xs text-[10px] text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Scheduled: {new Date(req.scheduled_delivery_at).toLocaleString()}
              </p>
            )}
          </div>
        ))
      ) : (
        <p className="text-muted-foreground text-[10px]">No pending delivery requests.</p>
      )}
    </div>
  )
}
