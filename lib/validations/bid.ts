import { z } from 'zod'

export const placeBidSchema = z.object({
  amount: z
    .number()
    .positive('Bid amount must be positive')
    .min(0.01, 'Bid amount must be at least $0.01'),
  auctionId: z.string().min(1, 'Auction ID is required')
})

export const buyNowSchema = z.object({
  auctionId: z.string().min(1, 'Auction ID is required')
})

export type PlaceBidData = z.infer<typeof placeBidSchema>
export type BuyNowData = z.infer<typeof buyNowSchema>
