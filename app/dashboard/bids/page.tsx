import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserBids, UserBid } from '@/lib/actions/dashboard'
import { MyBidsClient } from './bids-client'

export default async function MyBidsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const bids = await getUserBids()
  
  // Separate bids into categories
  const activeBids = bids.filter(bid => bid.status === 'winning' || bid.status === 'outbid')
  const wonBids = bids.filter(bid => bid.status === 'won')
  const lostBids = bids.filter(bid => bid.status === 'lost')
  
  return (
    <MyBidsClient 
      activeBids={activeBids}
      wonBids={wonBids}
      lostBids={lostBids}
    />
  )
}
