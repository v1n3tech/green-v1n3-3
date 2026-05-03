'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'

// Mock conversation data
const CONVERSATIONS = [
  {
    id: '1',
    name: 'Agro Technology Community',
    avatar: 'AT',
    lastMessage: 'Welcome to the community! Feel free to ask questions.',
    time: '2m ago',
    unread: 3,
    isGroup: true,
    online: true,
  },
  {
    id: '2',
    name: 'Ibrahim Musa',
    avatar: 'IM',
    lastMessage: 'The crop yield data looks promising this quarter.',
    time: '15m ago',
    unread: 0,
    isGroup: false,
    online: true,
  },
  {
    id: '3',
    name: 'Plateau State LGPA Forum',
    avatar: 'PL',
    lastMessage: 'Meeting scheduled for Friday at 2pm WAT',
    time: '1h ago',
    unread: 12,
    isGroup: true,
    online: false,
  },
  {
    id: '4',
    name: 'Amina Yusuf',
    avatar: 'AY',
    lastMessage: 'Thanks for the marketplace listing tips!',
    time: '3h ago',
    unread: 0,
    isGroup: false,
    online: false,
  },
  {
    id: '5',
    name: 'GreenV1n3 Support',
    avatar: 'GV',
    lastMessage: 'Your verification request has been received.',
    time: '1d ago',
    unread: 1,
    isGroup: false,
    online: true,
  },
]

const MESSAGES = [
  {
    id: '1',
    sender: 'Ibrahim Musa',
    content: 'Good morning! How are things going with the new irrigation system?',
    time: '10:30 AM',
    isMine: false,
    read: true,
  },
  {
    id: '2',
    sender: 'You',
    content: 'Morning! Installation completed yesterday. Running the first tests today.',
    time: '10:32 AM',
    isMine: true,
    read: true,
  },
  {
    id: '3',
    sender: 'Ibrahim Musa',
    content: 'That\'s excellent news! The crop yield data looks promising this quarter. We should share this with the community.',
    time: '10:35 AM',
    isMine: false,
    read: true,
  },
  {
    id: '4',
    sender: 'You',
    content: 'Agreed. I\'ll prepare a report for the next community meeting.',
    time: '10:36 AM',
    isMine: true,
    read: true,
  },
]

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('2')
  const [messageInput, setMessageInput] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all')

  const activeConversation = CONVERSATIONS.find(c => c.id === selectedConversation)

  const filteredConversations = CONVERSATIONS.filter(c => {
    if (filter === 'unread') return c.unread > 0
    if (filter === 'groups') return c.isGroup
    return true
  })

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ 07 — MESSAGES</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-[2px] hover:bg-primary/20 transition-colors">
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span className="mono-xs text-primary text-[10px]">NEW MESSAGE</span>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 border border-border rounded-[2px] overflow-hidden flex">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-border flex flex-col bg-card/30">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-secondary/50 border border-border rounded-[2px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search messages..."
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none flex-1 mono-xs"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-border flex gap-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'groups', label: 'Groups' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`px-3 py-1.5 mono-xs text-[9px] rounded-[2px] transition-colors ${
                  filter === tab.key
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`w-full flex items-start gap-3 p-3 border-b border-border transition-colors ${
                  selectedConversation === conversation.id
                    ? 'bg-primary/5 border-l-2 border-l-primary'
                    : 'hover:bg-secondary/50'
                }`}
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-[2px] flex items-center justify-center mono-xs text-[10px] font-bold ${
                    conversation.isGroup
                      ? 'bg-orange/10 border border-orange/30 text-orange'
                      : 'bg-primary/10 border border-primary/30 text-primary'
                  }`}>
                    {conversation.avatar}
                  </div>
                  {conversation.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="mono-xs text-[11px] text-foreground truncate">{conversation.name}</span>
                    <span className="mono-xs text-[9px] text-muted-foreground shrink-0">{conversation.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="mono-xs text-[10px] text-muted-foreground truncate">{conversation.lastMessage}</p>
                    {conversation.unread > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-primary text-background rounded-full mono-xs text-[9px] font-bold">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-14 px-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-[2px] flex items-center justify-center mono-xs text-[10px] font-bold ${
                    activeConversation.isGroup
                      ? 'bg-orange/10 border border-orange/30 text-orange'
                      : 'bg-primary/10 border border-primary/30 text-primary'
                  }`}>
                    {activeConversation.avatar}
                  </div>
                  <div>
                    <p className="mono-xs text-[11px] text-foreground">{activeConversation.name}</p>
                    <p className="mono-xs text-[9px] text-muted-foreground">
                      {activeConversation.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {MESSAGES.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.isMine ? 'order-1' : ''}`}>
                      <div className={`px-3 py-2 rounded-[2px] ${
                        message.isMine
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-secondary/50 border border-border'
                      }`}>
                        <p className="mono-xs text-[11px] text-foreground leading-relaxed">{message.content}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1 ${message.isMine ? 'justify-end' : ''}`}>
                        <span className="mono-xs text-[9px] text-muted-foreground">{message.time}</span>
                        {message.isMine && (
                          message.read ? (
                            <CheckCheck className="w-3 h-3 text-primary" />
                          ) : (
                            <Check className="w-3 h-3 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border rounded-[2px]">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none mono-xs"
                    />
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="p-2 bg-primary/10 border border-primary/30 rounded-[2px] text-primary hover:bg-primary/20 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mono-sm text-foreground mb-2">Select a conversation</h3>
              <p className="mono-xs text-muted-foreground text-[10px] max-w-xs">
                Choose a conversation from the sidebar or start a new message
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
