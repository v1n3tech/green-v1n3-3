'use client'

import { useState, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Plus, Search, Filter, MoreHorizontal, Clock,
  CheckCircle, XCircle, MessageSquare, ArrowRight, Send,
  Package, Users, TrendingUp, Zap, Star, RefreshCw,
  ChevronDown, X, Loader2, AlertCircle, DollarSign
} from 'lucide-react'
import { COMMUNITIES, type AgroCommunityKey } from '@/components/onboarding/data'
import {
  fetchServices,
  fetchMyRequests,
  createService,
  createServiceRequest,
  respondToRequest,
  cancelRequest,
  completeRequest,
  fetchServiceStats,
  type CommunityService,
  type ServiceRequest,
  type ServiceRequestStatus,
} from '@/lib/services/actions'

interface DashboardRequestsProps {
  userId: string
  role: string | null
  community: string | null
  communityLabel: string | null
  displayName: string | null
  agroId: string | null
}

type TabKey = 'browse' | 'my-requests' | 'incoming' | 'my-services'

const STATUS_CONFIG: Record<ServiceRequestStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-primary bg-primary/10 border-primary/30', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-destructive bg-destructive/10 border-destructive/30', icon: XCircle },
  negotiating: { label: 'Negotiating', color: 'text-orange bg-orange/10 border-orange/30', icon: MessageSquare },
  completed: { label: 'Completed', color: 'text-primary bg-primary/10 border-primary/30', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground bg-muted border-border', icon: XCircle },
}

export function DashboardRequests({
  userId,
  role,
  community,
  communityLabel,
  displayName,
  agroId,
}: DashboardRequestsProps) {
  const isGcm = role === 'gcm'
  const [activeTab, setActiveTab] = useState<TabKey>(isGcm ? 'incoming' : 'browse')
  const [services, setServices] = useState<CommunityService[]>([])
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([])
  const [incomingRequests, setIncomingRequests] = useState<ServiceRequest[]>([])
  const [myServices, setMyServices] = useState<CommunityService[]>([])
  const [stats, setStats] = useState<{ servicesCount: number; totalRequests: number; pendingCount: number; completedCount: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<AgroCommunityKey | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<ServiceRequestStatus | 'all'>('all')
  
  // Modals
  const [showCreateService, setShowCreateService] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedService, setSelectedService] = useState<CommunityService | null>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  
  // Load data
  useEffect(() => {
    loadData()
  }, [activeTab])
  
  async function loadData() {
    setLoading(true)
    try {
      if (activeTab === 'browse') {
        const { services } = await fetchServices({
          community: selectedCommunity !== 'all' ? selectedCommunity : undefined,
        })
        setServices(services)
      } else if (activeTab === 'my-requests') {
        const { requests } = await fetchMyRequests({ asGcm: false })
        setMyRequests(requests)
      } else if (activeTab === 'incoming' && isGcm) {
        const { requests } = await fetchMyRequests({ asGcm: true })
        setIncomingRequests(requests)
      } else if (activeTab === 'my-services' && isGcm) {
        const { services } = await fetchServices({ gcmId: userId, activeOnly: false })
        setMyServices(services)
      }
      
      if (isGcm) {
        const { stats: s } = await fetchServiceStats()
        setStats(s)
      }
    } finally {
      setLoading(false)
    }
  }
  
  const tabs: { key: TabKey; label: string; icon: typeof FileText; gcmOnly?: boolean }[] = [
    { key: 'browse', label: 'Browse Services', icon: Package },
    { key: 'my-requests', label: 'My Requests', icon: FileText },
    { key: 'incoming', label: 'Incoming', icon: Users, gcmOnly: true },
    { key: 'my-services', label: 'My Services', icon: Zap, gcmOnly: true },
  ]
  
  const filteredServices = services.filter(s => {
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (selectedCommunity !== 'all' && s.community !== selectedCommunity) return false
    return true
  })
  
  const filteredRequests = (activeTab === 'my-requests' ? myRequests : incomingRequests).filter(r => {
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false
    return true
  })
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ 08 — REQUESTS</span>
        </div>
        {isGcm && (
          <button
            onClick={() => setShowCreateService(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            CREATE SERVICE
          </button>
        )}
      </div>
      
      {/* GCM Stats */}
      {isGcm && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="MY SERVICES" value={stats.servicesCount} icon={<Package className="w-4 h-4" />} />
          <StatCard label="TOTAL REQUESTS" value={stats.totalRequests} icon={<FileText className="w-4 h-4" />} accent />
          <StatCard label="PENDING" value={stats.pendingCount} icon={<Clock className="w-4 h-4" />} />
          <StatCard label="COMPLETED" value={stats.completedCount} icon={<CheckCircle className="w-4 h-4" />} accent />
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {tabs.filter(t => !t.gcmOnly || isGcm).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 mono-xs text-[11px] border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.key === 'incoming' && isGcm && incomingRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-orange text-background mono-xs text-[8px] rounded-full">
                    {incomingRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
          />
        </div>
        {activeTab === 'browse' && (
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value as AgroCommunityKey | 'all')}
            className="px-4 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground outline-none focus:border-primary/50"
          >
            <option value="all">All Communities</option>
            {COMMUNITIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        )}
        {(activeTab === 'my-requests' || activeTab === 'incoming') && (
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ServiceRequestStatus | 'all')}
            className="px-4 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground outline-none focus:border-primary/50"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="negotiating">Negotiating</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
        <button
          onClick={() => loadData()}
          className="p-2.5 border border-border rounded-[2px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeTab === 'browse' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No Services Found"
                    description="No services match your filters. Try adjusting your search."
                  />
                ) : (
                  filteredServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onRequest={() => {
                        setSelectedService(service)
                        setShowRequestModal(true)
                      }}
                    />
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'my-requests' && (
              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No Requests Yet"
                    description="Browse services and make your first request."
                    action={{ label: 'Browse Services', onClick: () => setActiveTab('browse') }}
                  />
                ) : (
                  filteredRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      isGcm={false}
                      onAction={(action) => handleRequestAction(request, action)}
                    />
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'incoming' && isGcm && (
              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No Incoming Requests"
                    description="When users request your services, they will appear here."
                  />
                ) : (
                  filteredRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      isGcm={true}
                      onAction={(action) => {
                        setSelectedRequest(request)
                        if (action === 'respond') {
                          setShowResponseModal(true)
                        } else {
                          handleRequestAction(request, action)
                        }
                      }}
                    />
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'my-services' && isGcm && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myServices.length === 0 ? (
                  <EmptyState
                    icon={Zap}
                    title="No Services Created"
                    description="Create your first service to start receiving requests."
                    action={{ label: 'Create Service', onClick: () => setShowCreateService(true) }}
                  />
                ) : (
                  myServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isOwner
                      onEdit={() => {/* TODO: Edit service */}}
                    />
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Create Service Modal */}
      <CreateServiceModal
        open={showCreateService}
        onClose={() => setShowCreateService(false)}
        community={community as AgroCommunityKey}
        onCreated={() => {
          setShowCreateService(false)
          loadData()
        }}
      />
      
      {/* Request Service Modal */}
      <RequestServiceModal
        open={showRequestModal}
        onClose={() => {
          setShowRequestModal(false)
          setSelectedService(null)
        }}
        service={selectedService}
        onRequested={() => {
          setShowRequestModal(false)
          setSelectedService(null)
          setActiveTab('my-requests')
          loadData()
        }}
      />
      
      {/* Response Modal */}
      <ResponseModal
        open={showResponseModal}
        onClose={() => {
          setShowResponseModal(false)
          setSelectedRequest(null)
        }}
        request={selectedRequest}
        onResponded={() => {
          setShowResponseModal(false)
          setSelectedRequest(null)
          loadData()
        }}
      />
    </div>
  )
  
  async function handleRequestAction(request: ServiceRequest, action: string) {
    startTransition(async () => {
      if (action === 'cancel') {
        await cancelRequest(request.id)
      } else if (action === 'complete') {
        await completeRequest(request.id)
      } else if (action === 'accept') {
        await respondToRequest(request.id, 'accept')
      } else if (action === 'reject') {
        await respondToRequest(request.id, 'reject')
      }
      loadData()
    })
  }
}

// ============ SUB COMPONENTS ============

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="border border-border rounded-[2px] p-4 bg-card/50">
      <div className={`mb-2 ${accent ? 'text-primary' : 'text-muted-foreground'}`}>{icon}</div>
      <p className="mono text-xl text-foreground">{value}</p>
      <p className="mono-xs text-[9px] text-muted-foreground">{label}</p>
    </div>
  )
}

function ServiceCard({ service, onRequest, isOwner, onEdit }: { service: CommunityService; onRequest?: () => void; isOwner?: boolean; onEdit?: () => void }) {
  const community = COMMUNITIES.find(c => c.key === service.community)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-[2px] bg-card/50 overflow-hidden hover:border-primary/30 transition-colors"
    >
      {service.thumbnail && (
        <div className="h-32 bg-secondary relative">
          <img src={service.thumbnail} alt={service.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="mono-sm text-sm text-foreground line-clamp-1">{service.title}</h3>
          {service.is_featured && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-primary/10 text-primary mono-xs text-[8px] rounded-[2px]">
              FEATURED
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{service.description}</p>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-secondary border border-border mono-xs text-[9px] text-muted-foreground rounded-[2px]">
            {community?.label ?? service.community}
          </span>
          {service.turnaround_time && (
            <span className="flex items-center gap-1 mono-xs text-[9px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {service.turnaround_time}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <p className="mono text-sm text-primary">{service.price.toLocaleString()} V1N3</p>
            <p className="mono-xs text-[9px] text-muted-foreground">{service.price_unit}</p>
          </div>
          {isOwner ? (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 border border-border text-muted-foreground mono-xs text-[9px] rounded-[2px] hover:bg-secondary transition-colors"
            >
              EDIT
            </button>
          ) : (
            <button
              onClick={onRequest}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-background mono-xs text-[9px] rounded-[2px] hover:bg-primary/90 transition-colors"
            >
              REQUEST <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="mono-xs text-[10px] text-foreground/80">{service.rating.toFixed(1)}</span>
          </div>
          <span className="mono-xs text-[9px] text-muted-foreground">{service.completed_count} completed</span>
          <span className="mono-xs text-[9px] text-muted-foreground">{service.requests_count} requests</span>
        </div>
      </div>
    </motion.div>
  )
}

function RequestCard({ request, isGcm, onAction }: { request: ServiceRequest; isGcm: boolean; onAction: (action: string) => void }) {
  const status = STATUS_CONFIG[request.status]
  const StatusIcon = status.icon
  const currentPrice = request.final_price ?? request.gcm_quote ?? request.requester_quote ?? request.original_price
  
  return (
    <div className="border border-border rounded-[2px] bg-card/50 p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="mono-sm text-sm text-foreground">{request.service?.title ?? 'Service'}</h3>
              <p className="mono-xs text-[10px] text-muted-foreground mt-0.5">
                {isGcm ? `From: ${request.requester?.display_name ?? 'User'}` : `To: ${request.gcm?.display_name ?? 'GCM'}`}
                {' • '}
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`flex items-center gap-1 px-2 py-1 border rounded-[2px] mono-xs text-[9px] ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label.toUpperCase()}
            </span>
          </div>
          
          {request.message && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{request.message}</p>
          )}
          
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="mono-xs text-[9px] text-muted-foreground">ORIGINAL</p>
              <p className="mono-sm text-xs text-foreground">{request.original_price.toLocaleString()} V1N3</p>
            </div>
            {request.requester_quote && (
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground">YOUR QUOTE</p>
                <p className="mono-sm text-xs text-orange">{request.requester_quote.toLocaleString()} V1N3</p>
              </div>
            )}
            {request.gcm_quote && (
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground">GCM QUOTE</p>
                <p className="mono-sm text-xs text-primary">{request.gcm_quote.toLocaleString()} V1N3</p>
              </div>
            )}
            {request.final_price && (
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground">FINAL</p>
                <p className="mono-sm text-xs text-primary font-semibold">{request.final_price.toLocaleString()} V1N3</p>
              </div>
            )}
          </div>
          
          {request.gcm_response && (
            <div className="mt-3 p-2 bg-secondary/50 border border-border rounded-[2px]">
              <p className="mono-xs text-[9px] text-muted-foreground mb-1">RESPONSE</p>
              <p className="text-xs text-foreground/80">{request.gcm_response}</p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            {isGcm ? (
              <>
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onAction('accept')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-background mono-xs text-[9px] rounded-[2px] hover:bg-primary/90 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" /> ACCEPT
                    </button>
                    <button
                      onClick={() => onAction('respond')}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-orange text-orange mono-xs text-[9px] rounded-[2px] hover:bg-orange/5 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" /> COUNTER
                    </button>
                    <button
                      onClick={() => onAction('reject')}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive text-destructive mono-xs text-[9px] rounded-[2px] hover:bg-destructive/5 transition-colors"
                    >
                      <XCircle className="w-3 h-3" /> REJECT
                    </button>
                  </>
                )}
                {request.status === 'negotiating' && (
                  <>
                    <button
                      onClick={() => onAction('accept')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-background mono-xs text-[9px] rounded-[2px] hover:bg-primary/90 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" /> ACCEPT QUOTE
                    </button>
                    <button
                      onClick={() => onAction('respond')}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-orange text-orange mono-xs text-[9px] rounded-[2px] hover:bg-orange/5 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" /> COUNTER
                    </button>
                  </>
                )}
                {request.status === 'accepted' && (
                  <button
                    onClick={() => onAction('complete')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-background mono-xs text-[9px] rounded-[2px] hover:bg-primary/90 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" /> MARK COMPLETE
                  </button>
                )}
              </>
            ) : (
              <>
                {(request.status === 'pending' || request.status === 'negotiating') && (
                  <button
                    onClick={() => onAction('cancel')}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive text-destructive mono-xs text-[9px] rounded-[2px] hover:bg-destructive/5 transition-colors"
                  >
                    <XCircle className="w-3 h-3" /> CANCEL
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof FileText; title: string; description: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <h3 className="mono text-lg text-foreground mb-2">{title}</h3>
      <p className="mono-xs text-[11px] text-muted-foreground max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px]"
        >
          {action.label} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// ============ MODALS ============

function CreateServiceModal({ open, onClose, community, onCreated }: { open: boolean; onClose: () => void; community: AgroCommunityKey; onCreated: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [priceUnit, setPriceUnit] = useState('per service')
  const [turnaround, setTurnaround] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  if (!open) return null
  
  function handleSubmit() {
    if (!title || !description || !price) {
      setError('Please fill in all required fields')
      return
    }
    
    startTransition(async () => {
      const result = await createService({
        title,
        description,
        community,
        price: parseFloat(price),
        price_unit: priceUnit,
        turnaround_time: turnaround || undefined,
      })
      
      if (result.error) {
        setError(result.error)
      } else {
        onCreated()
        // Reset form
        setTitle('')
        setDescription('')
        setPrice('')
        setPriceUnit('per service')
        setTurnaround('')
        setError(null)
      }
    })
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-background border border-border rounded-[2px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="mono-sm text-sm text-foreground">Create Service</span>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-[2px]">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="mono-xs text-xs text-destructive">{error}</span>
            </div>
          )}
          
          <div>
            <label className="block mono-xs text-[10px] text-muted-foreground mb-1.5">SERVICE TITLE *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Soil Analysis Service"
              className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
            />
          </div>
          
          <div>
            <label className="block mono-xs text-[10px] text-muted-foreground mb-1.5">DESCRIPTION *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your service..."
              rows={3}
              className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mono-xs text-[10px] text-muted-foreground mb-1.5">PRICE (V1N3) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block mono-xs text-[10px] text-muted-foreground mb-1.5">PRICE UNIT</label>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="per service">Per Service</option>
                <option value="per hour">Per Hour</option>
                <option value="per day">Per Day</option>
                <option value="per kg">Per Kg</option>
                <option value="per hectare">Per Hectare</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block mono-xs text-[10px] text-muted-foreground mb-1.5">TURNAROUND TIME</label>
            <input
              type="text"
              value={turnaround}
              onChange={(e) => setTurnaround(e.target.value)}
              placeholder="e.g., 2-3 days"
              className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-muted-foreground mono-xs text-[10px] rounded-[2px] hover:bg-secondary transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            CREATE SERVICE
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function RequestServiceModal({ open, onClose, service, onRequested }: { open: boolean; onClose: () => void; service: CommunityService | null; onRequested: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [counterQuote, setCounterQuote] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  if (!open || !service) return null
  
  function handleSubmit() {
    startTransition(async () => {
      const result = await createServiceRequest({
        serviceId: service.id,
        message: message || undefined,
        counterQuote: counterQuote ? parseFloat(counterQuote) : undefined,
      })
      
      if (result.error) {
        setError(result.error)
      } else {
        onRequested()
        setMessage('')
        setCounterQuote('')
        setError(null)
      }
    })
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-background border border-border rounded-[2px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="mono-sm text-sm text-foreground">Request Service</span>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-[2px]">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="mono-xs text-xs text-destructive">{error}</span>
            </div>
          )}
          
          <div className="p-3 bg-secondary/50 border border-border rounded-[2px]">
            <h4 className="mono-sm text-sm text-foreground">{service.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="mono-xs text-[10px] text-muted-foreground">LISTED PRICE</span>
              <span className="mono text-sm text-primary">{service.price.toLocaleString()} V1N3</span>
            </div>
          </div>
          
          <div>
            <label className="block mono-xs text-[10px] text-muted-foreground mb-1.5">MESSAGE (OPTIONAL)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add details about your request..."
              rows={3}
              className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 resize-none"
            />
          </div>
          
          <div>
            <label className="block mono-xs text-[10px] text-muted-foreground mb-1.5">COUNTER QUOTE (OPTIONAL)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={counterQuote}
                onChange={(e) => setCounterQuote(e.target.value)}
                placeholder="Enter your proposed price in V1N3"
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
              />
            </div>
            <p className="mono-xs text-[9px] text-muted-foreground mt-1">Leave empty to accept the listed price</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-muted-foreground mono-xs text-[10px] rounded-[2px] hover:bg-secondary transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            SEND REQUEST
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function ResponseModal({ open, onClose, request, onResponded }: { open: boolean; onClose: () => void; request: ServiceRequest | null; onResponded: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [response, setResponse] = useState('')
  const [counterQuote, setCounterQuote] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  if (!open || !request) return null
  
  function handleSubmit() {
    if (!counterQuote) {
      setError('Please enter a counter quote')
      return
    }
    
    startTransition(async () => {
      const result = await respondToRequest(request.id, 'counter', {
        response: response || undefined,
        counterQuote: parseFloat(counterQuote),
      })
      
      if (result.error) {
        setError(result.error)
      } else {
        onResponded()
        setResponse('')
        setCounterQuote('')
        setError(null)
      }
    })
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-background border border-border rounded-[2px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="mono-sm text-sm text-foreground">Counter Quote</span>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-[2px]">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="mono-xs text-xs text-destructive">{error}</span>
            </div>
          )}
          
          <div className="p-3 bg-secondary/50 border border-border rounded-[2px]">
            <div className="flex items-center justify-between">
              <span className="mono-xs text-[10px] text-muted-foreground">ORIGINAL PRICE</span>
              <span className="mono-sm text-xs text-foreground">{request.original_price.toLocaleString()} V1N3</span>
            </div>
            {request.requester_quote && (
              <div className="flex items-center justify-between mt-2">
                <span className="mono-xs text-[10px] text-muted-foreground">THEIR QUOTE</span>
                <span className="mono-sm text-xs text-orange">{request.requester_quote.toLocaleString()} V1N3</span>
              </div>
            )}
          </div>
          
          <div>
            <label className="block mono-xs text-[10px] text-muted-foreground mb-1.5">YOUR COUNTER QUOTE (V1N3) *</label>
            <input
              type="number"
              value={counterQuote}
              onChange={(e) => setCounterQuote(e.target.value)}
              placeholder="Enter your counter price"
              className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
            />
          </div>
          
          <div>
            <label className="block mono-xs text-[10px] text-muted-foreground mb-1.5">MESSAGE (OPTIONAL)</label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Add a message..."
              rows={2}
              className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-muted-foreground mono-xs text-[10px] rounded-[2px] hover:bg-secondary transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange text-background mono-xs text-[10px] rounded-[2px] hover:bg-orange/90 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            SEND COUNTER
          </button>
        </div>
      </motion.div>
    </div>
  )
}
