import { getUserWatchlist } from "@/lib/actions/watchlist"
import { WatchlistClient } from "./watchlist-client"

export const dynamic = 'force-dynamic'

export default async function WatchlistPage() {
  const watchlistItems = await getUserWatchlist()

  return <WatchlistClient watchlistItems={watchlistItems} />
}
