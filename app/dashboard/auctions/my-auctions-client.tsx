'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Gavel, 
  Eye, 
  Clock, 
  DollarSign,
  Plus,
  Search,
  MoreVertical,
  Edit,
  X,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { formatCurrency, formatRelativeTime, getTimeRemaining } from '@/lib/utils'
import { updateAuction } from '@/lib/actions/auctions'
import { cancelAuction, deleteAuction } from '@/lib/actions/dashboard'
import { toast } from 'sonner'
import { UserAuction } from '@/lib/actions/dashboard'
import { useRouter } from 'next/navigation'

interface MyAuctionsPageClientProps {
  activeAuctions: UserAuction[]
  endedAuctions: UserAuction[]
  cancelledAuctions: UserAuction[]
}

export function MyAuctionsPageClient({ 
  activeAuctions, 
  endedAuctions, 
  cancelledAuctions 
}: MyAuctionsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const router = useRouter()
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAuction, setEditingAuction] = useState<UserAuction | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancellingAuction, setCancellingAuction] = useState<UserAuction | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAuction, setDeletingAuction] = useState<UserAuction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Filter auctions by search query
  const filterAuctions = (auctions: UserAuction[]) => {
    if (!searchQuery) return auctions
    const query = searchQuery.toLowerCase()
    return auctions.filter(auction =>
      auction.title.toLowerCase().includes(query) ||
      auction.description.toLowerCase().includes(query)
    )
  }
  
  const filteredActiveAuctions = filterAuctions(activeAuctions)
  const filteredEndedAuctions = filterAuctions(endedAuctions)
  const filteredCancelledAuctions = filterAuctions(cancelledAuctions)
  
  // Handle edit
  const handleEdit = (auction: UserAuction) => {
    setEditingAuction(auction)
    setEditDialogOpen(true)
  }
  
  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingAuction) return
    
    setIsUpdating(true)
    try {
      const formData = new FormData(event.currentTarget)
      formData.append('id', editingAuction.id)
      
      const result = await updateAuction(formData)
      
      if (result.success) {
        toast.success(result.message || 'Auction updated successfully!')
        setEditDialogOpen(false)
        setEditingAuction(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update auction')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Handle cancel
  const handleCancel = (auction: UserAuction) => {
    setCancellingAuction(auction)
    setCancelDialogOpen(true)
  }
  
  const confirmCancel = async () => {
    if (!cancellingAuction) return
    
    setIsCancelling(true)
    try {
      const result = await cancelAuction(cancellingAuction.id)
      
      if (result.success) {
        toast.success(result.message || 'Auction cancelled successfully!')
        setCancelDialogOpen(false)
        setCancellingAuction(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to cancel auction')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsCancelling(false)
    }
  }
  
  // Handle delete
  const handleDelete = (auction: UserAuction) => {
    setDeletingAuction(auction)
    setDeleteDialogOpen(true)
  }
  
  const confirmDelete = async () => {
    if (!deletingAuction) return
    
    setIsDeleting(true)
    try {
      const result = await deleteAuction(deletingAuction.id)
      
      if (result.success) {
        toast.success(result.message || 'Auction deleted successfully!')
        setDeleteDialogOpen(false)
        setDeletingAuction(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete auction')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const renderAuctionCard = (auction: UserAuction, showTimeRemaining: boolean = false) => {
    const timeRemaining = showTimeRemaining ? getTimeRemaining(auction.endTime) : null
    const imageUrl = auction.images?.[0] || 'https://placehold.co/400x300/e5e7eb/9ca3af?text=No+Image'
    
    return (
      <Card key={auction.id} className="overflow-hidden">
        <div className="aspect-video bg-muted relative">
          <Image
            src={imageUrl}
            alt={auction.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <Badge 
            className="absolute top-2 right-2"
            variant={auction.status === 'ACTIVE' ? 'default' : 'secondary'}
          >
            {auction.status}
          </Badge>
        </div>
        
        <CardHeader>
          <CardTitle className="line-clamp-1">{auction.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {auction.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{formatCurrency(auction.currentPrice)}</div>
                <div className="text-xs text-muted-foreground">Current bid</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Gavel className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{auction._count.bids}</div>
                <div className="text-xs text-muted-foreground">Bids</div>
              </div>
            </div>
          </div>
          
          {/* Time remaining */}
          {showTimeRemaining && timeRemaining && !timeRemaining.isExpired && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>
                {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                {timeRemaining.hours}h {timeRemaining.minutes}m left
              </span>
            </div>
          )}
          
          {/* Ended date */}
          {!showTimeRemaining && auction.status === 'ENDED' && (
            <div className="text-sm text-muted-foreground">
              Ended {formatRelativeTime(new Date(auction.endTime))}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/auctions/${auction.id}`}>
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {auction.status === 'ACTIVE' && (
                  <>
                    <DropdownMenuItem onClick={() => handleEdit(auction)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleCancel(auction)}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </DropdownMenuItem>
                  </>
                )}
                {(auction.status === 'ENDED' || auction.status === 'CANCELLED') && (
                  <DropdownMenuItem 
                    onClick={() => handleDelete(auction)}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Auctions</h2>
          <p className="text-muted-foreground">
            Manage your auction listings and track their performance.
          </p>
        </div>
        <Button asChild>
          <Link href="/auctions/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Auction
          </Link>
        </Button>
      </div>
      
      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search your auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active ({activeAuctions.length})
          </TabsTrigger>
          <TabsTrigger value="ended">
            Ended ({endedAuctions.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledAuctions.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Active auctions */}
        <TabsContent value="active" className="mt-6">
          {filteredActiveAuctions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredActiveAuctions.map(auction => renderAuctionCard(auction, true))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active auctions</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {searchQuery ? 'No auctions match your search' : 'Create your first auction to start selling'}
                </p>
                {!searchQuery && (
                  <Button asChild>
                    <Link href="/auctions/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Auction
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Ended auctions */}
        <TabsContent value="ended" className="mt-6">
          {filteredEndedAuctions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEndedAuctions.map(auction => renderAuctionCard(auction))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ended auctions</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'No auctions match your search' : 'Your completed auctions will appear here'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Cancelled auctions */}
        <TabsContent value="cancelled" className="mt-6">
          {filteredCancelledAuctions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCancelledAuctions.map(auction => renderAuctionCard(auction))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cancelled auctions</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'No auctions match your search' : 'Your cancelled auctions will appear here'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Auction</DialogTitle>
              <DialogDescription>
                Update your auction details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  name="title"
                  defaultValue={editingAuction?.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingAuction?.description}
                  required
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Starting Price</label>
                  <Input
                    type="number"
                    name="startingPrice"
                    step="0.01"
                    defaultValue={editingAuction?.startingPrice}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buy Now Price (Optional)</label>
                  <Input
                    type="number"
                    name="buyNowPrice"
                    step="0.01"
                    defaultValue={editingAuction?.buyNowPrice || ''}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <select
                  name="duration"
                  defaultValue="7"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Auction?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this auction? This action cannot be undone.
              Bidders will be notified of the cancellation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              No, Keep It
            </Button>
            <Button
              onClick={confirmCancel}
              disabled={isCancelling}
              variant="destructive"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Auction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Auction?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this auction? This action cannot be undone.
              All data associated with this auction will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

