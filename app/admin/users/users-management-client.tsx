'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, Search, Send, User, AlertTriangle, Ban, Trash2 } from 'lucide-react'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { suspendUser, banUser, deleteUser, unsuspendUser, unbanUser, getOrCreateConversation } from '@/app/messages/actions'
import { toast } from 'sonner'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  university: string | null
  verified: boolean
  status: string
  suspendedAt: string | null
  suspendedUntil: string | null
  suspendedReason: string | null
  bannedAt: string | null
  bannedUntil: string | null
  bannedReason: string | null
  createdAt: string
}

interface UsersManagementClientProps {
  initialData: {
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
    universities: string[]
  }
}

export function UsersManagementClient({ initialData }: UsersManagementClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [universityFilter, setUniversityFilter] = useState(searchParams.get('university') || 'all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  // Dialog states
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; userId?: string }>({ open: false })
  const [banDialog, setBanDialog] = useState<{ open: boolean; userId?: string }>({ open: false })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId?: string }>({ open: false })
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendDuration, setSuspendDuration] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('')

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value !== 'all') {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    params.set('page', '1')
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleUniversityFilter = (value: string) => {
    setUniversityFilter(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value !== 'all') {
      params.set('university', value)
    } else {
      params.delete('university')
    }
    params.set('page', '1')
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleSuspend = async () => {
    if (!suspendDialog.userId || !suspendReason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    startTransition(async () => {
      try {
        const duration = suspendDuration ? parseInt(suspendDuration) : undefined
        const result = await suspendUser(suspendDialog.userId!, suspendReason, duration)
        if (result.success) {
          toast.success('User suspended successfully')
          setSuspendDialog({ open: false })
          setSuspendReason('')
          setSuspendDuration('')
          router.refresh()
        } else {
          toast.error('Failed to suspend user')
        }
      } catch (error) {
        toast.error('Failed to suspend user')
      }
    })
  }

  const handleBan = async () => {
    if (!banDialog.userId || !banReason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    startTransition(async () => {
      try {
        const duration = banDuration ? parseInt(banDuration) : undefined
        const result = await banUser(banDialog.userId!, banReason, duration)
        if (result.success) {
          toast.success('User banned successfully')
          setBanDialog({ open: false })
          setBanReason('')
          setBanDuration('')
          router.refresh()
        } else {
          toast.error('Failed to ban user')
        }
      } catch (error) {
        toast.error('Failed to ban user')
      }
    })
  }

  const handleDelete = async () => {
    if (!deleteDialog.userId) return

    startTransition(async () => {
      try {
        const result = await deleteUser(deleteDialog.userId!)
        if (result.success) {
          toast.success('User deleted successfully')
          setDeleteDialog({ open: false })
          router.refresh()
        } else {
          toast.error(result.error || 'Failed to delete user')
        }
      } catch (error) {
        toast.error('Failed to delete user')
      }
    })
  }

  const handleSendMessage = async (userId: string) => {
    try {
      const result = await getOrCreateConversation(userId)
      if (result.success) {
        router.push(`/messages?conversation=${result.conversationId}`)
      } else {
        toast.error(result.error || 'Failed to create conversation')
      }
    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  const getStatusBadge = (user: User) => {
    switch (user.status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>
      case 'SUSPENDED':
        return <Badge variant="secondary">Suspended</Badge>
      case 'BANNED':
        return <Badge variant="destructive">Banned</Badge>
      default:
        return <Badge variant="secondary">{user.status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage users and their accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={universityFilter} onValueChange={handleUniversityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by university" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {initialData.universities.map((uni) => (
              <SelectItem key={uni} value={uni}>
                {uni}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      {user.verified && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>{user.university || '-'}</TableCell>
                <TableCell>{getStatusBadge(user)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRelativeTime(new Date(user.createdAt))}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${user.id}`}>
                          <User className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendMessage(user.id)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === 'ACTIVE' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => setSuspendDialog({ open: true, userId: user.id })}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setBanDialog({ open: true, userId: user.id })}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        </>
                      )}
                      {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                        <DropdownMenuItem
                          onClick={async () => {
                            const result = user.status === 'SUSPENDED'
                              ? await unsuspendUser(user.id)
                              : await unbanUser(user.id)
                            if (result.success) {
                              toast.success(`User ${user.status === 'SUSPENDED' ? 'unsuspended' : 'unbanned'} successfully`)
                              router.refresh()
                            }
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Restore User
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {initialData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((initialData.page - 1) * initialData.limit) + 1} to{' '}
            {Math.min(initialData.page * initialData.limit, initialData.total)} of {initialData.total} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={initialData.page === 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(initialData.page - 1))
                router.push(`/admin/users?${params.toString()}`)
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={initialData.page === initialData.totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(initialData.page + 1))
                router.push(`/admin/users?${params.toString()}`)
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend this user's account. Provide a reason for suspension.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspend-reason">Reason</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Enter reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="suspend-duration">Duration (days, optional)</Label>
              <Input
                id="suspend-duration"
                type="number"
                placeholder="Leave empty for indefinite"
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSuspend} disabled={isPending || !suspendReason.trim()}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Permanently ban this user's account. Provide a reason for the ban.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ban-reason">Reason</Label>
              <Textarea
                id="ban-reason"
                placeholder="Enter reason for ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ban-duration">Duration (days, optional)</Label>
              <Input
                id="ban-duration"
                type="number"
                placeholder="Leave empty for permanent ban"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleBan} disabled={isPending || !banReason.trim()}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
