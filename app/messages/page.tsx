import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getConversations } from './actions'
import { MessagesClient } from './messages-client'

export default async function MessagesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const conversations = await getConversations()

  return <MessagesClient userId={user.id} initialConversations={conversations} />
}

