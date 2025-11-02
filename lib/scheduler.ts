'use server'

import { db } from '@/lib/db'
import { AuctionStatus, NotificationType } from '@prisma/client'
import { createNotification } from '@/lib/notifications'
import {
  sendAuctionWonEmail,
  sendAuctionEndingEmail
} from '@/lib/email'
import { formatCurrency, getTimeRemaining } from '@/lib/utils'

/**
 * Check and end auctions where endTime has passed
 * @returns Number of auctions that were ended
 */
export async function checkAndEndAuctions(): Promise<number> {
  try {
    const now = new Date()

    // Find all active auctions where endTime has passed
    const expiredAuctions = await db.auction.findMany({
      where: {
        status: AuctionStatus.ACTIVE,
        endTime: {
          lte: now
        }
      },
      include: {
        user: true, // Seller
        bids: {
          orderBy: {
            amount: 'desc'
          },
          take: 1, // Get highest bid
          include: {
            user: true // Winner
          }
        }
      }
    })

    let endedCount = 0

    // Process each expired auction
    for (const auction of expiredAuctions) {
      try {
        const highestBid = auction.bids[0]

        await db.$transaction(async (tx) => {
          if (highestBid) {
            // Auction has bids - set winner
            await tx.auction.update({
              where: { id: auction.id },
              data: {
                status: AuctionStatus.ENDED,
                winnerId: highestBid.userId,
                currentPrice: highestBid.amount
              }
            })

            // Send notification to winner
            await createNotification(
              highestBid.userId,
              NotificationType.AUCTION_WON,
              `Congratulations! You won "${auction.title}" for ${formatCurrency(Number(highestBid.amount))}`,
              `/auctions/${auction.id}`
            )

            // Send notification to seller
            await createNotification(
              auction.userId,
              NotificationType.AUCTION_ENDED,
              `Your auction "${auction.title}" ended. Winner: ${highestBid.user.name}`,
              `/auctions/${auction.id}`
            )

            // Send email to winner
            sendAuctionWonEmail(highestBid.user, auction).catch((error) => {
              console.error(`Error sending winner email for auction ${auction.id}:`, error)
            })

            // Note: Seller already receives in-app notification
            // Email notification for sellers can be added later if needed
          } else {
            // No bids - just end the auction
            await tx.auction.update({
              where: { id: auction.id },
              data: {
                status: AuctionStatus.ENDED
              }
            })

            // Send notification to seller
            await createNotification(
              auction.userId,
              NotificationType.AUCTION_ENDED,
              `Your auction "${auction.title}" ended without any bids.`,
              `/auctions/${auction.id}`
            )
          }
        })

        endedCount++
      } catch (error) {
        console.error(`Error processing auction ${auction.id}:`, error)
        // Continue with next auction even if one fails
      }
    }

    return endedCount
  } catch (error) {
    console.error('Error checking and ending auctions:', error)
    throw error
  }
}

/**
 * Send auction ending reminders to current highest bidders
 * @param hoursRemaining - Hours until auction ends (1 for 1 hour, 24 for 24 hours)
 * @returns Number of reminders sent
 */
async function sendEndingReminders(hoursRemaining: number): Promise<number> {
  try {
    const now = new Date()
    const targetTime = new Date(now.getTime() + hoursRemaining * 60 * 60 * 1000)

    // Find auctions ending around the target time (within a 5-minute window)
    const endingAuctions = await db.auction.findMany({
      where: {
        status: AuctionStatus.ACTIVE,
        endTime: {
          gte: new Date(targetTime.getTime() - 5 * 60 * 1000), // 5 minutes before
          lte: new Date(targetTime.getTime() + 5 * 60 * 1000) // 5 minutes after
        }
      },
      include: {
        bids: {
          orderBy: {
            amount: 'desc'
          },
          take: 1, // Get highest bid
          include: {
            user: true // Current highest bidder
          }
        }
      }
    })

    let reminderCount = 0

    for (const auction of endingAuctions) {
      const highestBid = auction.bids[0]

      if (highestBid) {
        try {
          const timeRemaining = getTimeRemaining(auction.endTime)
          const timeRemainingStr = timeRemaining.days > 0
            ? `${timeRemaining.days}d ${timeRemaining.hours}h`
            : timeRemaining.hours > 0
            ? `${timeRemaining.hours}h ${timeRemaining.minutes}m`
            : `${timeRemaining.minutes}m`

          // Send notification
          await createNotification(
            highestBid.userId,
            NotificationType.BID_PLACED, // Reuse existing type or create new one
            `"${auction.title}" is ending in ${hoursRemaining === 1 ? '1 hour' : '24 hours'}. Current bid: ${formatCurrency(Number(auction.currentPrice))}`,
            `/auctions/${auction.id}`
          )

          // Send email reminder
          sendAuctionEndingEmail(
            highestBid.user,
            auction,
            timeRemainingStr
          ).catch((error) => {
            console.error(`Error sending ending reminder email for auction ${auction.id}:`, error)
          })

          reminderCount++
        } catch (error) {
          console.error(`Error sending reminder for auction ${auction.id}:`, error)
          // Continue with next auction
        }
      }
    }

    return reminderCount
  } catch (error) {
    console.error(`Error sending ${hoursRemaining} hour reminders:`, error)
    return 0
  }
}

/**
 * Send auction ending reminders (1 hour and 24 hours)
 * @returns Object with counts of reminders sent
 */
export async function sendAuctionEndingReminders(): Promise<{
  oneHour: number
  twentyFourHours: number
}> {
  try {
    const [oneHourCount, twentyFourHoursCount] = await Promise.all([
      sendEndingReminders(1),
      sendEndingReminders(24)
    ])

    return {
      oneHour: oneHourCount,
      twentyFourHours: twentyFourHoursCount
    }
  } catch (error) {
    console.error('Error sending auction ending reminders:', error)
    throw error
  }
}

