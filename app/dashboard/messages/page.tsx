'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Users,
  Star,
  Archive,
  Pin,
  PinOff,
  BellOff,
  Bell,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  Shield,
  Crown,
  User,
  Building2,
  AtSign,
  ArrowLeft,
  Reply,
  Hash,
  Circle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  File,
} from 'lucide-react'
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  getOrCreateDirectConversation,
  getOrCreateCommunityGroupChat,
  searchUsers,
  getCurrentUserId,
  fetchConversationParticipants,
  addReaction,
  removeReaction,
  fetchReactions,
  type Conversation,
  type Message,
  type ConversationParticipant,
  type Reaction,
} from '@/lib/messaging/actions'
import { createClient } from '@/lib/supabase/client'
import type { AgroCommunityKey } from '@/components/onboarding/data'

// Role display config
const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof User }> = {
  executive: { label: 'EXEC', color: 'text-primary bg-primary/10 border-primary/30', icon: User },
  gcm: { label: 'GCM', color: 'text-orange bg-orange/10 border-orange/30', icon: Crown },
  lgpa: { label: 'LGPA', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30', icon: Building2 },
  scc: { label: 'SCC', color: 'text-purple-500 bg-purple-500/10 border-purple-500/30', icon: Shield },
  admin: { label: 'ADMIN', color: 'text-destructive bg-destructive/10 border-destructive/30', icon: Shield },
}

// Community colors
const COMMUNITY_COLORS: Record<string, string> = {
  'agro-technology': 'bg-emerald-500',
  'livestock': 'bg-amber-500',
  'crops': 'bg-green-500',
  'media-branding': 'bg-violet-500',
  'health': 'bg-red-500',
  'finance-legal': 'bg-blue-500',
  'logistics': 'bg-orange-500',
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups' | 'direct'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [participants, setParticipants] = useState<ConversationParticipant[]>([])
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isSending, startSending] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachment, setAttachment] = useState<{ file: File; preview: string; type: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({})
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null)

  // Load current user ID and conversations on mount
  useEffect(() => {
    async function init() {
      const userId = await getCurrentUserId()
      setCurrentUserId(userId)
      loadConversations()
    }
    init()
    
    // Check for mobile view
    const checkMobile = () => setIsMobileView(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      loadParticipants(selectedConversation.id)
    }
  }, [selectedConversation?.id])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!selectedConversation) return

    const supabase = createClient()
    
    // Subscribe to new messages in the selected conversation
    const channel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any
          
          // Fetch the full message with sender info and reply data
          const { data: fullMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id, display_name, agro_id, avatar_url, role, community
              )
            `)
            .eq('id', newMsg.id)
            .single()
          
          if (fullMessage) {
            // If it has a reply_to_id, fetch the reply data
            let replyData = null
            if (fullMessage.reply_to_id) {
              const { data: replyMsg } = await supabase
                .from('messages')
                .select(`
                  id, content, sender_id,
                  sender:profiles!messages_sender_id_fkey ( display_name )
                `)
                .eq('id', fullMessage.reply_to_id)
                .single()
              replyData = replyMsg
            }
            
            const messageWithReply = {
              ...fullMessage,
              reply_to: replyData,
            } as Message
            
            setMessages(prev => {
              if (prev.some(m => m.id === messageWithReply.id)) return prev
              return [...prev, messageWithReply]
            })
          }
        }
      )
      .subscribe()

    // Subscribe to reactions in this conversation's messages
    const reactionsChannel = supabase
      .channel(`reactions-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        async (payload) => {
          // Refresh reactions for the affected message
          const msgId = (payload.new as any)?.message_id || (payload.old as any)?.message_id
          if (!msgId) return
          
          const { data } = await supabase
            .from('message_reactions')
            .select(`*, user:profiles!message_reactions_user_id_fkey ( display_name, agro_id )`)
            .eq('message_id', msgId)
            .order('created_at', { ascending: true })
          
          if (data) {
            setReactions(prev => ({ ...prev, [msgId]: data as Reaction[] }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(reactionsChannel)
    }
  }, [selectedConversation?.id])

  // Update online presence
  useEffect(() => {
    if (!currentUserId) return
    
    const supabase = createClient()
    
    // Update last_active_at periodically
    const updatePresence = async () => {
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', currentUserId)
    }
    
    // Update immediately and then every 30 seconds
    updatePresence()
    const interval = setInterval(updatePresence, 30000)
    
    return () => clearInterval(interval)
  }, [currentUserId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    setLoading(true)
    const { conversations } = await fetchConversations()
    setConversations(conversations)
    setLoading(false)
  }

  async function loadMessages(conversationId: string) {
    setMessagesLoading(true)
    const { messages } = await fetchMessages(conversationId)
    setMessages(messages)
    setMessagesLoading(false)
    // Load reactions for these messages
    if (messages.length > 0) {
      const { reactions: rxns } = await fetchReactions(messages.map(m => m.id))
      setReactions(rxns)
    }
  }

  async function loadParticipants(conversationId: string) {
    const { participants } = await fetchConversationParticipants(conversationId)
    setParticipants(participants)
  }

  async function handleSendMessage() {
    if (!selectedConversation || (!messageInput.trim() && !attachment)) return

    const currentReply = replyingTo // capture before clearing

    startSending(async () => {
      const { message, error } = await sendMessage(selectedConversation.id, messageInput, {
        replyToId: currentReply?.id,
        attachmentUrl: attachment?.preview,
        attachmentName: attachment?.file.name,
        attachmentSize: attachment?.file.size,
      })
      
      if (message) {
        // Attach reply_to data if this was a reply
        const messageWithReply = currentReply
          ? { ...message, reply_to: { id: currentReply.id, content: currentReply.content, sender_id: currentReply.sender_id, sender: currentReply.sender ? { display_name: currentReply.sender.display_name } : undefined } }
          : message
        
        setMessages(prev => [...prev, messageWithReply])
        setMessageInput('')
        setReplyingTo(null)
        setAttachment(null)
        // Update conversation last message
        setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id 
            ? { ...c, last_message: message, last_message_at: message.created_at }
            : c
        ))
      }
    })
  }
  
  // Handle emoji selection
  function handleEmojiSelect(emoji: any) {
    setMessageInput(prev => prev + emoji.native)
    setShowEmojiPicker(false)
  }

  // Handle reaction emoji selection
  async function handleReactionSelect(emoji: any) {
    if (!reactionPickerMessageId || !currentUserId) return
    const emojiChar = emoji.native
    const messageReactions = reactions[reactionPickerMessageId] || []
    const existing = messageReactions.find(r => r.emoji === emojiChar && r.user_id === currentUserId)
    
    if (existing) {
      await removeReaction(reactionPickerMessageId, emojiChar)
      setReactions(prev => ({
        ...prev,
        [reactionPickerMessageId]: (prev[reactionPickerMessageId] || []).filter(r => r.id !== existing.id)
      }))
    } else {
      await addReaction(reactionPickerMessageId, emojiChar)
      // Optimistic update
      setReactions(prev => ({
        ...prev,
        [reactionPickerMessageId]: [...(prev[reactionPickerMessageId] || []), {
          id: crypto.randomUUID(),
          message_id: reactionPickerMessageId,
          user_id: currentUserId,
          emoji: emojiChar,
          created_at: new Date().toISOString(),
        }]
      }))
    }
    setReactionPickerMessageId(null)
  }

  // Toggle a quick reaction
  async function toggleReaction(messageId: string, emojiChar: string) {
    if (!currentUserId) return
    const messageReactions = reactions[messageId] || []
    const existing = messageReactions.find(r => r.emoji === emojiChar && r.user_id === currentUserId)
    
    if (existing) {
      await removeReaction(messageId, emojiChar)
      setReactions(prev => ({
        ...prev,
        [messageId]: (prev[messageId] || []).filter(r => r.id !== existing.id)
      }))
    } else {
      await addReaction(messageId, emojiChar)
      setReactions(prev => ({
        ...prev,
        [messageId]: [...(prev[messageId] || []), {
          id: crypto.randomUUID(),
          message_id: messageId,
          user_id: currentUserId,
          emoji: emojiChar,
          created_at: new Date().toISOString(),
        }]
      }))
    }
  }
        }]
      }))
    }
  }
  
  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }
    
    // Create preview for images
    const isImage = file.type.startsWith('image/')
    if (isImage) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAttachment({
          file,
          preview: reader.result as string,
          type: 'image',
        })
      }
      reader.readAsDataURL(file)
    } else {
      // For non-image files, we'd upload to blob storage
      // For now, just store file info
      setAttachment({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.includes('pdf') ? 'pdf' : 'file',
      })
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
      // Close reaction picker on outside click - but not if clicking inside the picker
      const target = e.target as HTMLElement
      if (reactionPickerMessageId && !target.closest('[data-reaction-picker]')) {
        setReactionPickerMessageId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [reactionPickerMessageId])

  async function handleSelectConversation(conv: Conversation) {
    setSelectedConversation(conv)
    if (isMobileView) {
      setShowMobileChat(true)
    }
    // Reset unread count locally
    setConversations(prev => prev.map(c => 
      c.id === conv.id ? { ...c, unread_count: 0 } : c
    ))
  }

  const filteredConversations = conversations.filter(c => {
    if (filter === 'unread') return (c.unread_count || 0) > 0
    if (filter === 'groups') return c.type === 'group'
    if (filter === 'direct') return c.type === 'direct'
    return true
  }).filter(c => {
    if (!searchQuery) return true
    const name = c.type === 'direct' 
      ? c.other_participant?.display_name || ''
      : c.name || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  function getConversationName(conv: Conversation): string {
    if (conv.type === 'direct') {
      return conv.other_participant?.display_name || 'Unknown User'
    }
    return conv.name || 'Group Chat'
  }

  function getConversationAvatar(conv: Conversation): string {
    if (conv.type === 'direct' && conv.other_participant) {
      return conv.other_participant.display_name.slice(0, 2).toUpperCase()
    }
    if (conv.community) {
      return conv.community.slice(0, 2).toUpperCase()
    }
    return conv.name?.slice(0, 2).toUpperCase() || 'GC'
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  function formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Check if user is online (active within last 2 minutes)
  function isUserOnline(lastActiveAt?: string): boolean {
    if (!lastActiveAt) return false
    const lastActive = new Date(lastActiveAt)
    const now = new Date()
    const diffMs = now.getTime() - lastActive.getTime()
    return diffMs < 2 * 60 * 1000 // 2 minutes
  }

  // Mobile back button handler
  function handleMobileBack() {
    setShowMobileChat(false)
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ 07 — MESSAGES</span>
        </div>
        <button 
          onClick={() => setShowNewChat(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-[2px] hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span className="mono-xs text-primary text-[10px]">NEW MESSAGE</span>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 border border-border rounded-[2px] overflow-hidden flex bg-card/20">
        {/* Conversations Sidebar */}
        <div className={`${isMobileView ? (showMobileChat ? 'hidden' : 'w-full') : 'w-80'} border-r border-border flex flex-col bg-background/50`}>
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-secondary/30 border border-border rounded-[2px] focus-within:border-primary/50 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none flex-1 mono-xs"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2.5 border-b border-border flex gap-1.5 overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: conversations.length },
              { key: 'unread', label: 'Unread', count: conversations.filter(c => (c.unread_count || 0) > 0).length },
              { key: 'groups', label: 'Groups', count: conversations.filter(c => c.type === 'group').length },
              { key: 'direct', label: 'Direct', count: conversations.filter(c => c.type === 'direct').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`shrink-0 px-3 py-1.5 mono-xs text-[9px] rounded-[2px] transition-all ${
                  filter === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 ${filter === tab.key ? 'text-primary-foreground/70' : 'text-muted-foreground/50'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-3" />
                <p className="mono-xs text-[11px] text-muted-foreground">No conversations found</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-3 mono-xs text-[10px] text-primary hover:underline"
                >
                  Start a new conversation
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredConversations.map((conversation) => {
                  const isSelected = selectedConversation?.id === conversation.id
                  const name = getConversationName(conversation)
                  const avatar = getConversationAvatar(conversation)
                  const roleConfig = conversation.other_participant?.role 
                    ? ROLE_CONFIG[conversation.other_participant.role] 
                    : null
                  
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full flex items-start gap-3 p-3.5 transition-all ${
                        isSelected
                          ? 'bg-primary/5 border-l-2 border-l-primary'
                          : 'hover:bg-secondary/30 border-l-2 border-l-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-[3px] flex items-center justify-center mono-xs text-[11px] font-bold ${
                          conversation.type === 'group'
                            ? 'bg-gradient-to-br from-orange/20 to-orange/5 border border-orange/30 text-orange'
                            : 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary'
                        }`}>
                          {conversation.type === 'group' ? (
                            <Users className="w-5 h-5" />
                          ) : (
                            avatar
                          )}
                        </div>
                        {conversation.type === 'direct' && conversation.other_participant && (
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                            isUserOnline(conversation.other_participant.last_active_at) 
                              ? 'bg-primary' 
                              : 'bg-muted-foreground/30'
                          }`} />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="mono-xs text-[11px] text-foreground truncate font-medium">{name}</span>
                            {roleConfig && (
                              <span className={`shrink-0 px-1.5 py-0.5 border rounded-[2px] mono-xs text-[8px] ${roleConfig.color}`}>
                                {roleConfig.label}
                              </span>
                            )}
                          </div>
                          <span className="mono-xs text-[9px] text-muted-foreground shrink-0">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        </div>
                        
                        {/* Agro ID or community */}
                        <div className="flex items-center gap-1 mb-1">
                          <AtSign className="w-2.5 h-2.5 text-muted-foreground/50" />
                          <span className="mono-xs text-[9px] text-muted-foreground/70 truncate">
                            {conversation.type === 'direct' 
                              ? conversation.other_participant?.agro_id || ''
                              : conversation.community?.replace('-', ' ') || 'group'
                            }
                          </span>
                        </div>
                        
                        {/* Last message */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="mono-xs text-[10px] text-muted-foreground truncate">
                            {conversation.last_message?.content || 'No messages yet'}
                          </p>
                          {(conversation.unread_count || 0) > 0 && (
                            <span className="shrink-0 min-w-[20px] h-[20px] flex items-center justify-center px-1.5 bg-primary text-primary-foreground rounded-full mono-xs text-[9px] font-bold">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${isMobileView && !showMobileChat ? 'hidden' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {isMobileView && (
                    <button onClick={handleMobileBack} className="p-1.5 text-muted-foreground hover:text-foreground mr-1">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-[3px] flex items-center justify-center mono-xs text-[10px] font-bold ${
                      selectedConversation.type === 'group'
                        ? 'bg-gradient-to-br from-orange/20 to-orange/5 border border-orange/30 text-orange'
                        : 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary'
                    }`}>
                      {selectedConversation.type === 'group' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        getConversationAvatar(selectedConversation)
                      )}
                    </div>
                    {selectedConversation.type === 'direct' && selectedConversation.other_participant && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                        isUserOnline(selectedConversation.other_participant.last_active_at) 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/30'
                      }`} />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="mono-sm text-[12px] text-foreground font-medium">
                        {getConversationName(selectedConversation)}
                      </p>
                      {selectedConversation.other_participant?.role && (
                        <span className={`px-1.5 py-0.5 border rounded-[2px] mono-xs text-[8px] ${
                          ROLE_CONFIG[selectedConversation.other_participant.role]?.color || ''
                        }`}>
                          {ROLE_CONFIG[selectedConversation.other_participant.role]?.label || ''}
                        </span>
                      )}
                    </div>
                    <p className="mono-xs text-[9px] text-muted-foreground flex items-center gap-1">
                      {selectedConversation.type === 'group' ? (
                        <>
                          <Users className="w-3 h-3" />
                          {participants.length} members
                        </>
                      ) : selectedConversation.other_participant ? (
                        isUserOnline(selectedConversation.other_participant.last_active_at) ? (
                          <>
                            <Circle className="w-2 h-2 fill-primary text-primary" />
                            <span className="text-primary">Online</span>
                          </>
                        ) : (
                          <>
                            <AtSign className="w-3 h-3" />
                            {selectedConversation.other_participant.agro_id}
                          </>
                        )
                      ) : (
                        <>
                          <AtSign className="w-3 h-3" />
                          {selectedConversation.other_participant?.agro_id || ''}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {selectedConversation.type === 'group' && (
                    <button 
                      onClick={() => setShowParticipants(true)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-[2px] transition-colors"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-[2px] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gradient-to-b from-background to-background/95">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-[4px] bg-primary/5 border border-primary/20 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-primary/40" />
                    </div>
                    <p className="mono-xs text-[11px] text-muted-foreground">No messages yet</p>
                    <p className="mono-xs text-[10px] text-muted-foreground/50 mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isMine = message.sender_id === currentUserId
                      const showSender = selectedConversation.type === 'group' || !isMine
                      const prevMessage = messages[index - 1]
                      const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id
                      const senderRole = message.sender?.role ? ROLE_CONFIG[message.sender.role] : null
                      
                      // Function to scroll to replied message
                      const scrollToMessage = (messageId: string) => {
                        const element = document.getElementById(`message-${messageId}`)
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background')
                          setTimeout(() => {
                            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background')
                          }, 2000)
                        }
                      }
                      
                      return (
                        <motion.div
                          key={message.id}
                          id={`message-${message.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-0.5'} transition-all duration-300`}
                        >
                          {/* Avatar - only for other users */}
                          {!isMine && showAvatar && (
                            <div className="w-8 h-8 rounded-[2px] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mono-xs text-[9px] text-primary font-bold mr-2 shrink-0">
                              {message.sender?.display_name?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                          )}
                          {!isMine && !showAvatar && <div className="w-8 mr-2" />}
                          
                          <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                            {/* Sender name for group chats - only for other users */}
                            {showSender && showAvatar && !isMine && (
                              <div className="flex items-center gap-1.5 mb-1 ml-1">
                                <span className="mono-xs text-[10px] text-foreground/80 font-medium">
                                  {message.sender?.display_name || 'Unknown'}
                                </span>
                                {senderRole && (
                                  <span className={`px-1 py-0.5 border rounded-[2px] mono-xs text-[7px] ${senderRole.color}`}>
                                    {senderRole.label}
                                  </span>
                                )}
                                <span className="mono-xs text-[8px] text-muted-foreground/50">
                                  @{message.sender?.agro_id}
                                </span>
                              </div>
                            )}
                            
                            {/* Reply quote - clickable, hanging off the message */}
                            {message.reply_to && (
                              <button
                                onClick={() => scrollToMessage(message.reply_to!.id)}
                                className={`flex items-center gap-1.5 mb-0.5 px-2 py-1 rounded-t-[3px] bg-muted/50 border border-b-0 border-border/50 hover:bg-muted transition-colors ${
                                  isMine ? 'mr-2 self-end' : 'ml-2 self-start'
                                }`}
                              >
                                <Reply className="w-2.5 h-2.5 text-muted-foreground/60 rotate-180" />
                                <span className="mono-xs text-[8px] text-muted-foreground/80 font-medium">
                                  {message.reply_to.sender?.display_name || 'Unknown'}
                                </span>
                                <span className="mono-xs text-[9px] text-muted-foreground/60 truncate max-w-[150px]">
                                  {message.reply_to.content}
                                </span>
                              </button>
                            )}
                            
                            {/* Message bubble */}
                            <div 
                              className={`group relative px-3.5 py-2.5 rounded-[4px] ${
                                isMine
                                  ? 'bg-primary text-primary-foreground rounded-br-none'
                                  : 'bg-secondary/60 border border-border rounded-bl-none'
                              }`}
                            >
                              {/* Attachment */}
                              {message.attachment_url && (
                                <div className="mb-2">
                                  {message.attachment_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                                      <img 
                                        src={message.attachment_url} 
                                        alt={message.attachment_name} 
                                        className="max-w-full rounded-[2px] max-h-48 object-cover"
                                      />
                                    </a>
                                  ) : (
                                    <a 
                                      href={message.attachment_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-2 rounded-[2px] border ${
                                        isMine 
                                          ? 'bg-primary-foreground/10 border-primary-foreground/20' 
                                          : 'bg-primary/5 border-primary/20'
                                      }`}
                                    >
                                      {message.attachment_name?.endsWith('.pdf') ? (
                                        <FileText className={`w-5 h-5 ${isMine ? 'text-primary-foreground' : 'text-primary'}`} />
                                      ) : (
                                        <File className={`w-5 h-5 ${isMine ? 'text-primary-foreground' : 'text-primary'}`} />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className={`mono-xs text-[10px] truncate ${isMine ? 'text-primary-foreground' : 'text-foreground'}`}>
                                          {message.attachment_name}
                                        </p>
                                        {message.attachment_size && (
                                          <p className={`mono-xs text-[8px] ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                            {(message.attachment_size / 1024).toFixed(1)} KB
                                          </p>
                                        )}
                                      </div>
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              {message.content && (
                                <p className={`text-[12px] leading-relaxed ${isMine ? 'text-primary-foreground' : 'text-foreground'}`}>
                                  {message.content}
                                </p>
                              )}
                              
                              {/* Hover actions: Reply + Reaction */}
                              <div className={`absolute -top-2 ${isMine ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all`}>
                                <button
                                  onClick={() => setReplyingTo(message)}
                                  className="p-1 bg-background border border-border rounded-[2px] text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Reply className="w-3 h-3" />
                                </button>
                              </div>
                              
                              {/* Reaction trigger - bottom right of bubble */}
                              <button
                                onClick={() => setReactionPickerMessageId(reactionPickerMessageId === message.id ? null : message.id)}
                                className={`absolute -bottom-2 ${isMine ? 'left-1' : 'right-1'} w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${
                                  isMine 
                                    ? 'bg-primary-foreground/20 hover:bg-primary-foreground/40 text-primary-foreground' 
                                    : 'bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground'
                                } backdrop-blur-sm border border-border/30`}
                              >
                                <Smile className="w-3 h-3" />
                              </button>
                              
                              {/* Reaction picker popup */}
                              {reactionPickerMessageId === message.id && (
                                <div data-reaction-picker className={`absolute ${isMine ? 'left-0' : 'right-0'} -bottom-10 z-50`}>
                                  <div className="flex items-center gap-1 p-1.5 bg-popover border border-border rounded-[4px] shadow-lg">
                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => {
                                          toggleReaction(message.id, emoji)
                                          setReactionPickerMessageId(null)
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded-[2px] hover:bg-secondary transition-colors text-sm"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => {
                                        // Keep the picker message ID set - will use the full emoji picker
                                      }}
                                      className="w-7 h-7 flex items-center justify-center rounded-[2px] hover:bg-secondary transition-colors text-muted-foreground"
                                    >
                                      <Smile className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Reactions display */}
                            {reactions[message.id] && reactions[message.id].length > 0 && (
                              <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                                {Object.entries(
                                  reactions[message.id].reduce((acc, r) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                    return acc
                                  }, {} as Record<string, number>)
                                ).map(([emoji, count]) => {
                                  const iReacted = reactions[message.id].some(r => r.emoji === emoji && r.user_id === currentUserId)
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => toggleReaction(message.id, emoji)}
                                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] border transition-colors ${
                                        iReacted
                                          ? 'bg-primary/10 border-primary/30 text-primary'
                                          : 'bg-secondary/60 border-border/50 text-muted-foreground hover:border-primary/30'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      {(count as number) > 1 && <span className="mono-xs text-[8px]">{count as number}</span>}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                            
                            {/* Time and read status */}
                            <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                              <span className="mono-xs text-[9px] text-muted-foreground/60">
                                {formatMessageTime(message.created_at)}
                              </span>
                              {isMine && (
                                <CheckCheck className="w-3.5 h-3.5 text-primary/60" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Reply indicator */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 border-t border-border bg-secondary/30"
                  >
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Reply className="w-4 h-4 text-primary rotate-180" />
                        <div className="mono-xs text-[10px]">
                          <span className="text-muted-foreground">Replying to </span>
                          <span className="text-foreground font-medium">{replyingTo.sender?.display_name}</span>
                        </div>
                        <span className="mono-xs text-[10px] text-muted-foreground/70 truncate max-w-[200px]">
                          {replyingTo.content}
                        </span>
                      </div>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Input */}
              <div className="border-t border-border bg-background/80 backdrop-blur-sm">
                {/* Attachment Preview */}
                <AnimatePresence>
                  {attachment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pt-3"
                    >
                      <div className="flex items-center gap-3 p-2 bg-secondary/50 border border-border rounded-[3px]">
                        {attachment.type === 'image' ? (
                          <img src={attachment.preview} alt="Preview" className="w-12 h-12 rounded-[2px] object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center">
                            {attachment.type === 'pdf' ? <FileText className="w-5 h-5 text-primary" /> : <File className="w-5 h-5 text-primary" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="mono-xs text-[11px] text-foreground truncate">{attachment.file.name}</p>
                          <p className="mono-xs text-[9px] text-muted-foreground">{(attachment.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button 
                          onClick={() => setAttachment(null)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-4 flex items-center gap-2">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-[2px] transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-secondary/30 border border-border rounded-[3px] focus-within:border-primary/50 transition-colors">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
                    />
                    
                    {/* Emoji Picker */}
                    <div className="relative" ref={emojiPickerRef}>
                      <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`text-muted-foreground hover:text-foreground transition-colors ${showEmojiPicker ? 'text-primary' : ''}`}
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                      
                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 z-50"
                          >
                            <Picker 
                              data={data} 
                              onEmojiSelect={handleEmojiSelect}
                              theme="dark"
                              previewPosition="none"
                              skinTonePosition="search"
                              maxFrequentRows={2}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSendMessage}
                    disabled={(!messageInput.trim() && !attachment) || isSending}
                    className="p-2.5 bg-primary rounded-[3px] text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-background to-background/95">
              <div className="w-20 h-20 rounded-[4px] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center mb-5">
                <MessageSquare className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="mono-sm text-foreground mb-2 text-lg">Select a conversation</h3>
              <p className="mono-xs text-muted-foreground text-[11px] max-w-xs leading-relaxed">
                Choose a conversation from the sidebar or start a new message to connect with other members
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-5 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-[3px] mono-xs text-[11px] hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal 
        open={showNewChat} 
        onClose={() => setShowNewChat(false)}
        onConversationCreated={(conv) => {
          setConversations(prev => [conv, ...prev])
          setSelectedConversation(conv)
          setShowNewChat(false)
          if (isMobileView) setShowMobileChat(true)
        }}
      />

      {/* Participants Modal */}
      <ParticipantsModal
        open={showParticipants}
        onClose={() => setShowParticipants(false)}
        participants={participants}
        conversationName={selectedConversation?.name || ''}
      />
    </div>
  )
}

// ============ NEW CHAT MODAL ============
function NewChatModal({
  open,
  onClose,
  onConversationCreated,
}: {
  open: boolean
  onClose: () => void
  onConversationCreated: (conv: Conversation) => void
}) {
  const [tab, setTab] = useState<'users' | 'groups'>('users')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<Array<{
    id: string
    display_name: string
    agro_id: string
    avatar_url: string | null
    role: string
    community: string | null
    can_message: boolean
    reason?: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open && search.length >= 2) {
      searchUsers()
    }
  }, [search, open])

  async function searchUsers() {
    setLoading(true)
    const { users } = await searchUsersForMessaging(search)
    setUsers(users)
    setLoading(false)
  }

  async function handleStartChat(userId: string) {
    setCreating(true)
    const { conversation, error } = await getOrCreateDirectConversation(userId)
    setCreating(false)
    
    if (error) {
      setErrorMessage(error)
      return
    }
    
    if (conversation) {
      setErrorMessage(null)
      onConversationCreated(conversation)
    }
  }

  async function handleJoinCommunityGroup(community: AgroCommunityKey) {
    setCreating(true)
    setErrorMessage(null)
    const { conversation, error } = await getOrCreateCommunityGroupChat(community)
    setCreating(false)
    
    if (error) {
      setErrorMessage(error)
      return
    }
    
    if (conversation) {
      onConversationCreated(conversation)
    }
  }

  if (!open) return null

  const communities: { key: AgroCommunityKey; name: string }[] = [
    { key: 'agro_technology', name: 'Agro Technology' },
    { key: 'animal_farming', name: 'Livestock' },
    { key: 'crop_farming', name: 'Crops' },
    { key: 'agro_media_branding', name: 'Media & Branding' },
    { key: 'agro_healthcare', name: 'Health' },
    { key: 'agro_management_legislation', name: 'Finance & Legal' },
    { key: 'agro_logistics', name: 'Logistics' },
    { key: 'agro_marketing', name: 'Agro Marketing' },
    { key: 'agro_processing', name: 'Agro Processing' },
    { key: 'agro_tourism', name: 'Agro Tourism' },
    { key: 'agro_security', name: 'Agro Security' },
    { key: 'agro_literature', name: 'Agro Literature' },
    { key: 'agro_motivation_training', name: 'Motivation & Training' },
    { key: 'agro_real_estate', name: 'Green Real Estate' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-background border border-border rounded-[3px] overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="mono-sm text-sm text-foreground">New Conversation</span>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 py-2 border-b border-border flex gap-2">
          <button
            onClick={() => setTab('users')}
            className={`px-3 py-1.5 mono-xs text-[10px] rounded-[2px] transition-all ${
              tab === 'users' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3 h-3 inline mr-1.5" />
            Direct Message
          </button>
          <button
            onClick={() => setTab('groups')}
            className={`px-3 py-1.5 mono-xs text-[10px] rounded-[2px] transition-all ${
              tab === 'groups' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3 h-3 inline mr-1.5" />
            Community Groups
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-3"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-[2px]">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="mono-xs text-[10px] text-destructive flex-1">{errorMessage}</p>
                <button 
                  onClick={() => setErrorMessage(null)}
                  className="p-0.5 text-destructive/70 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'users' ? (
            <>
              {/* Search */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-secondary/30 border border-border rounded-[2px] mb-4 focus-within:border-primary/50">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or Agro ID..."
                  className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none flex-1"
                />
              </div>

              {/* Users list */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : search.length < 2 ? (
                <div className="text-center py-8">
                  <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="mono-xs text-[11px] text-muted-foreground">
                    Type at least 2 characters to search
                  </p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="mono-xs text-[11px] text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role]
                    return (
                      <button
                        key={user.id}
                        onClick={() => user.can_message && handleStartChat(user.id)}
                        disabled={!user.can_message || creating}
                        className={`w-full flex items-center gap-3 p-3 border rounded-[2px] text-left transition-all ${
                          user.can_message
                            ? 'border-border hover:border-primary/50 hover:bg-primary/5'
                            : 'border-border/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center mono-xs text-[10px] text-primary font-bold">
                          {user.display_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="mono-xs text-[11px] text-foreground font-medium truncate">
                              {user.display_name}
                            </span>
                            {roleConfig && (
                              <span className={`px-1.5 py-0.5 border rounded-[2px] mono-xs text-[8px] ${roleConfig.color}`}>
                                {roleConfig.label}
                              </span>
                            )}
                          </div>
                          <p className="mono-xs text-[9px] text-muted-foreground">@{user.agro_id}</p>
                          {!user.can_message && user.reason && (
                            <p className="mono-xs text-[9px] text-destructive/70 mt-1">{user.reason}</p>
                          )}
                        </div>
                        {user.can_message && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <p className="mono-xs text-[10px] text-muted-foreground mb-3">
                Join your community group chat to connect with other executives
              </p>
              {communities.map((community) => (
                <button
                  key={community.key}
                  onClick={() => handleJoinCommunityGroup(community.key)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 p-3 border border-border rounded-[2px] text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className={`w-10 h-10 rounded-[2px] flex items-center justify-center ${COMMUNITY_COLORS[community.key]}/20 border border-white/10`}>
                    <Hash className={`w-5 h-5 ${COMMUNITY_COLORS[community.key].replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1">
                    <span className="mono-xs text-[11px] text-foreground font-medium">{community.name}</span>
                    <p className="mono-xs text-[9px] text-muted-foreground">Community group chat</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ============ PARTICIPANTS MODAL ============
function ParticipantsModal({
  open,
  onClose,
  participants,
  conversationName,
}: {
  open: boolean
  onClose: () => void
  participants: ConversationParticipant[]
  conversationName: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm bg-background border border-border rounded-[3px] overflow-hidden max-h-[70vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <span className="mono-sm text-sm text-foreground">Group Members</span>
            <p className="mono-xs text-[9px] text-muted-foreground">{participants.length} members</p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Participants list */}
        <div className="flex-1 overflow-y-auto p-2">
          {participants.map((participant) => {
            const roleConfig = participant.user?.role ? ROLE_CONFIG[participant.user.role] : null
            return (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-2.5 rounded-[2px] hover:bg-secondary/30"
              >
                <div className="w-9 h-9 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center mono-xs text-[9px] text-primary font-bold">
                  {participant.user?.display_name?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="mono-xs text-[11px] text-foreground truncate">
                      {participant.user?.display_name || 'Unknown'}
                    </span>
                    {roleConfig && (
                      <span className={`px-1 py-0.5 border rounded-[2px] mono-xs text-[7px] ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                    )}
                    {participant.role === 'admin' && (
                      <Crown className="w-3 h-3 text-orange" />
                    )}
                  </div>
                  <p className="mono-xs text-[9px] text-muted-foreground">@{participant.user?.agro_id}</p>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
