'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { NotificationType } from '@prisma/client'
import { sendNewMessageEmail } from '@/lib/email'

// Get or create conversation between two users
export async function getOrCreateConversation(otherUserId: string) {
  try {
    const user = await requireAuth()

    if (user.id === otherUserId) {
      return { success: false, error: 'Cannot create conversation with yourself' }
    }

    // Check if other user exists
    const otherUser = await db.user.findUnique({
      where: { id: otherUserId }
    })

    if (!otherUser) {
      return { success: false, error: 'User not found' }
    }

    // Check if conversation already exists
    const existingConversation = await db.conversationParticipant.findFirst({
      where: {
        userId: user.id,
        conversation: {
          participants: {
            some: {
              userId: otherUserId
            }
          }
        }
      },
      include: {
        conversation: true
      }
    })

    if (existingConversation) {
      return {
        success: true,
        conversationId: existingConversation.conversationId
      }
    }

    // Create new conversation with both participants
    const conversation = await db.conversation.create({
      data: {
        participants: {
          create: [
            { userId: user.id },
            { userId: otherUserId }
          ]
        }
      }
    })

    revalidatePath('/messages')

    return {
      success: true,
      conversationId: conversation.id
    }
  } catch (error) {
    console.error('Error getting or creating conversation:', error)
    return { success: false, error: 'Failed to create conversation' }
  }
}

// Send a message
export async function sendMessage(conversationId: string, content: string) {
  try {
    const user = await requireAuth()

    // Validate content
    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Message cannot be empty' }
    }

    if (content.length > 1000) {
      return { success: false, error: 'Message is too long (max 1000 characters)' }
    }

    // Verify user is participant in conversation
    const participant = await db.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId: user.id,
          conversationId
        }
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId: {
                  not: user.id
                }
              },
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!participant) {
      return { success: false, error: 'Not a participant in this conversation' }
    }

    // Create message and update conversation in transaction
    const result = await db.$transaction(async (tx) => {
      // Create message
      const message = await tx.message.create({
        data: {
          content: content.trim(),
          senderId: user.id,
          conversationId,
          read: false
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              verified: true
            }
          }
        }
      })

      // Update conversation lastMessageAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      })

      // Mark message as read for sender (it's their own message)
      await tx.message.update({
        where: { id: message.id },
        data: { read: true }
      })

      return message
    })

    // Create notification for recipient
    const recipient = participant.conversation.participants[0]?.user
    if (recipient) {
      await createNotification(
        recipient.id,
        NotificationType.MESSAGE,
        `New message from ${user.name}`,
        `/messages`
      )

      // Send email notification (fire and forget)
      sendNewMessageEmail(
        recipient,
        user.name,
        result.content.substring(0, 100) // Preview first 100 chars
      ).catch((error) => {
        console.error('Error sending message email:', error)
      })
    }

    revalidatePath(`/messages/${conversationId}`)
    revalidatePath('/messages')

    return {
      success: true,
      message: {
        id: result.id,
        content: result.content,
        senderId: result.senderId,
        conversationId: result.conversationId,
        read: result.read,
        createdAt: result.createdAt.toISOString(),
        sender: result.sender
      }
    }
  } catch (error) {
    console.error('Error sending message:', error)
    return { success: false, error: 'Failed to send message' }
  }
}

// Mark messages as read
export async function markAsRead(conversationId: string) {
  try {
    const user = await requireAuth()

    // Verify user is participant
    const participant = await db.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId: user.id,
          conversationId
        }
      }
    })

    if (!participant) {
      return { success: false, error: 'Not a participant in this conversation' }
    }

    // Mark all unread messages as read
    await db.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: user.id
        },
        read: false
      },
      data: {
        read: true
      }
    })

    revalidatePath(`/messages/${conversationId}`)
    revalidatePath('/messages')

    return { success: true }
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return { success: false, error: 'Failed to mark messages as read' }
  }
}

// Get all conversations for user
export async function getConversations() {
  try {
    const user = await requireAuth()

    const conversations = await db.conversationParticipant.findMany({
      where: {
        userId: user.id
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId: {
                  not: user.id
                }
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    verified: true
                  }
                }
              }
            },
            messages: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        conversation: {
          lastMessageAt: 'desc'
        }
      }
    })

    return conversations.map((participant: {
      conversation: {
        id: string
        lastMessageAt: Date | null
        createdAt: Date
        participants: Array<{
          user: {
            id: string
            name: string
            avatar: string | null
            verified: boolean
          }
        }>
        messages: Array<{
          id: string
          content: string
          senderId: string
          createdAt: Date
          read: boolean
          sender: {
            id: string
            name: string
            avatar: string | null
          }
        }>
      }
    }) => {
      const otherUser = participant.conversation.participants[0]?.user
      const lastMessage = participant.conversation.messages[0]
      
      // Count unread messages
      const unreadCount = participant.conversation.messages.filter(
        (msg: { read: boolean; senderId: string }) => !msg.read && msg.senderId !== user.id
      ).length

      return {
        id: participant.conversation.id,
        otherUser: otherUser || null,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt.toISOString(),
          sender: lastMessage.sender
        } : null,
        lastMessageAt: participant.conversation.lastMessageAt?.toISOString() || null,
        unreadCount,
        createdAt: participant.conversation.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
}

// Get messages for a conversation
export async function getMessages(conversationId: string) {
  try {
    const user = await requireAuth()

    // Verify user is participant
    const participant = await db.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId: user.id,
          conversationId
        }
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId: {
                  not: user.id
                }
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    verified: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!participant) {
      return { success: false, error: 'Not a participant in this conversation', messages: [] }
    }

    // Fetch messages
    const messages = await db.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return {
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        conversationId: msg.conversationId,
        read: msg.read,
        createdAt: msg.createdAt.toISOString(),
        sender: msg.sender
      })),
      otherUser: participant.conversation.participants[0]?.user || null
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return { success: false, error: 'Failed to fetch messages', messages: [] }
  }
}

