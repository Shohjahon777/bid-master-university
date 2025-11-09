'use client'

import { useState, useEffect, useRef, useMemo, useDeferredValue, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, Send, User } from 'lucide-react'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { sendMessage, markAsRead, getMessages, getMessageDetails } from './actions'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

interface Conversation {
  id: string
  otherUser: {
    id: string
    name: string
    avatar: string | null
    verified: boolean
  } | null
  lastMessage: {
    id: string
    content: string
    senderId: string
    createdAt: string
    sender: {
      id: string
      name: string
      avatar: string | null
    }
  } | null
  lastMessageAt: string | null
  unreadCount: number
  createdAt: string
}

interface Message {
  id: string
  content: string
  senderId: string
  conversationId: string
  read: boolean
  createdAt: string
  sender: {
    id: string
    name: string
    avatar: string | null
    verified: boolean
  }
}

interface MessagesClientProps {
  userId: string
  initialConversations: Conversation[]
}

export function MessagesClient({ userId, initialConversations }: MessagesClientProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversations[0]?.id || null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const selectedConversationRef = useRef<string | null>(selectedConversationId)
  useEffect(() => {
    selectedConversationRef.current = selectedConversationId
  }, [selectedConversationId])

  const deferredSearchQuery = useDeferredValue(searchQuery)

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!deferredSearchQuery.trim()) {
      return conversations
    }
    const query = deferredSearchQuery.toLowerCase()
    return conversations.filter((conv) => {
      return (
        conv.otherUser?.name.toLowerCase().includes(query) ||
        conv.lastMessage?.content.toLowerCase().includes(query)
      )
    })
  }, [conversations, deferredSearchQuery])

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      setIsLoading(true)
      try {
        const result = await getMessages(selectedConversationId)
        if (result.success) {
          setMessages(result.messages || [])
          // Mark messages as read
          await markAsRead(selectedConversationId)
          // Update conversation unread count
          setConversations(prev =>
            prev.map(conv =>
              conv.id === selectedConversationId ? { ...conv, unreadCount: 0 } : conv
            )
          )
        } else {
          toast.error(result.error || 'Failed to load messages')
        }
      } catch (error) {
        console.error('Error loading messages:', error)
        toast.error('Failed to load messages')
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
    setMobileView('chat')
  }, [selectedConversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`messages:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const inserted = payload.new as { id: string; senderId: string; conversationId: string } | null
          if (!inserted) return

          // Ignore messages we just sent (already optimistically added)
          if (inserted.senderId === userId) {
            return
          }

          const result = await getMessageDetails(inserted.id)
          if (!result.success || !result.message || !result.conversation) {
            return
          }

          const { message, conversation } = result

          setConversations((prev) => {
            const latestMessage = {
              id: message.id,
              content: message.content,
              senderId: message.senderId,
              createdAt: message.createdAt,
              sender: message.sender
            }

            const existingIndex = prev.findIndex((conv) => conv.id === conversation.id)
            const shouldIncrementUnread =
              message.senderId !== userId &&
              selectedConversationRef.current !== conversation.id

            if (existingIndex === -1) {
              const newConversation: Conversation = {
                id: conversation.id,
                otherUser: conversation.otherUser,
                lastMessage: latestMessage,
                lastMessageAt: conversation.lastMessageAt ?? message.createdAt,
                unreadCount: shouldIncrementUnread ? 1 : 0,
                createdAt: conversation.createdAt
              }

              return [newConversation, ...prev]
            }

            const existing = prev[existingIndex]

            let unreadCount = existing.unreadCount
            if (message.senderId !== userId) {
              if (selectedConversationRef.current === conversation.id) {
                unreadCount = 0
              } else if (shouldIncrementUnread) {
                unreadCount = existing.unreadCount + 1
              }
            }

            const updated: Conversation = {
              ...existing,
              otherUser: existing.otherUser ?? conversation.otherUser,
              lastMessage: latestMessage,
              lastMessageAt: conversation.lastMessageAt ?? message.createdAt,
              unreadCount
            }

            const updatedList = [...prev]
            updatedList.splice(existingIndex, 1)
            updatedList.unshift(updated)
            return updatedList
          })

          if (selectedConversationRef.current === conversation.id) {
            setMessages((prev) => [...prev, message])
            void markAsRead(conversation.id)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to messages channel')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleSendMessage = useCallback(async () => {
    if (!selectedConversationId || !messageContent.trim() || isSending) return

    setIsSending(true)
    try {
      const result = await sendMessage(selectedConversationId, messageContent)
      if (result.success && result.message) {
        setMessageContent('')
        setMessages((prev) => [...prev, result.message!])
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversationId
              ? {
                  ...conv,
                  lastMessage: {
                    id: result.message!.id,
                    content: result.message!.content,
                    senderId: result.message!.senderId,
                    createdAt: result.message!.createdAt,
                    sender: result.message!.sender,
                  },
                  lastMessageAt: result.message!.createdAt,
                }
              : conv,
          ),
        )
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }, [
    isSending,
    messageContent,
    selectedConversationId,
    setConversations,
    setMessages,
  ])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Sidebar - Conversations List */}
      <div
        className={`${
          mobileView === 'list' ? 'flex' : 'hidden'
        } lg:flex flex-col w-full lg:w-[30%] border-r bg-background`}
      >
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {filteredConversations.length > 0 ? (
            <div className="divide-y">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    selectedConversationId === conversation.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={conversation.otherUser?.avatar || undefined}
                        alt={conversation.otherUser?.name || 'User'}
                      />
                      <AvatarFallback>
                        {conversation.otherUser
                          ? getInitials(conversation.otherUser.name)
                          : <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">
                            {conversation.otherUser?.name || 'Unknown User'}
                          </span>
                          {conversation.otherUser?.verified && (
                            <Badge variant="secondary" className="h-4 px-1 text-xs">
                              ✓
                            </Badge>
                          )}
                        </div>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(new Date(conversation.lastMessageAt))}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 h-5 min-w-[20px]">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversations</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations match your search' : 'Start a conversation to see messages here'}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Chat */}
      <div
        className={`${
          mobileView === 'chat' ? 'flex' : 'hidden'
        } lg:flex flex-col flex-1 bg-background`}
      >
        {selectedConversationId && selectedConversation ? (
          <>
            {isLoading ? (
              <div className="flex flex-col flex-1">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex gap-2 max-w-[70%] ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Skeleton className="h-[60px] flex-1 rounded-md" />
                    <Skeleton className="h-[60px] w-[60px] rounded-md" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileView('list')}
                      className="lg:hidden mr-2"
                    >
                      ← Back
                    </button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={selectedConversation.otherUser?.avatar || undefined}
                        alt={selectedConversation.otherUser?.name || 'User'}
                      />
                      <AvatarFallback>
                        {selectedConversation.otherUser
                          ? getInitials(selectedConversation.otherUser.name)
                          : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {selectedConversation.otherUser?.name || 'Unknown User'}
                        </span>
                        {selectedConversation.otherUser?.verified && (
                          <Badge variant="secondary" className="h-4 px-1 text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/profile/${selectedConversation.otherUser?.id}`)}
                  >
                    View Profile
                  </Button>
                </div>

                {/* Messages List */}
                <ScrollArea ref={messagesContainerRef} className="flex-1 p-4">
                  {messages.length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date}>
                          <div className="text-center text-xs text-muted-foreground mb-4">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {dateMessages.map((message) => {
                            const isOwnMessage = message.senderId === userId
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
                              >
                                <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                  {!isOwnMessage && (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={message.sender.avatar || undefined}
                                        alt={message.sender.name}
                                      />
                                      <AvatarFallback>
                                        {getInitials(message.sender.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                    {!isOwnMessage && (
                                      <span className="text-xs text-muted-foreground mb-1">
                                        {message.sender.name}
                                      </span>
                                    )}
                                    <div
                                      className={`rounded-lg px-4 py-2 ${
                                        isOwnMessage
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-foreground'
                                      }`}
                                    >
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                      </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1">
                                      {formatRelativeTime(new Date(message.createdAt))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="text-muted-foreground mb-2">No messages yet</div>
                      <p className="text-sm text-muted-foreground">
                        Start the conversation by sending a message below.
                      </p>
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message... (Press Enter to send)"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="min-h-[60px] resize-none"
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || isSending}
                      size="icon"
                      className="h-[60px] w-[60px]"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-muted-foreground mb-4">
              <User className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
              <p className="text-sm text-muted-foreground">
                Select a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

