'use client'

import { useState, useEffect } from 'react'
import { getTimeRemaining } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface AuctionCountdownProps {
  endTime: Date | string
  className?: string
}

export function AuctionCountdown({ endTime, className }: AuctionCountdownProps) {
  // Convert string to Date if needed
  const endTimeDate = typeof endTime === 'string' ? new Date(endTime) : endTime
  
  const [timeRemaining, setTimeRemaining] = useState(() => 
    getTimeRemaining(endTimeDate)
  )

  useEffect(() => {
    if (timeRemaining.isExpired) return

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(endTimeDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [endTimeDate, timeRemaining.isExpired])

  const formatTimeRemaining = () => {
    if (timeRemaining.isExpired) return 'Auction Ended'
    
    const { days, hours, minutes, seconds } = timeRemaining
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const getCountdownColor = () => {
    if (timeRemaining.isExpired) return 'bg-gray-100 text-gray-800 border-gray-200'
    
    const { days, hours, minutes } = timeRemaining
    
    // More than 1 day: green
    if (days > 0) return 'bg-green-100 text-green-800 border-green-200'
    
    // Less than 1 day but more than 1 hour: yellow
    if (hours > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    
    // Less than 1 hour: red
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <Badge 
      className={`${getCountdownColor()} border font-medium ${className}`}
      variant="outline"
    >
      {formatTimeRemaining()}
    </Badge>
  )
}
