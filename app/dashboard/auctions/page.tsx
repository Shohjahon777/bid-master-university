import { MyAuctionsPageClient } from './my-auctions-client'
import { getUserAuctions } from '@/lib/actions/dashboard'

export default async function MyAuctionsPage() {
  // Fetch all user auctions
  const [activeAuctions, endedAuctions, cancelledAuctions] = await Promise.all([
    getUserAuctions('ACTIVE'),
    getUserAuctions('ENDED'),
    getUserAuctions('CANCELLED')
  ])

  return (
    <MyAuctionsPageClient
      activeAuctions={activeAuctions}
      endedAuctions={endedAuctions}
      cancelledAuctions={cancelledAuctions}
    />
  )
}
