'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Input } from '@/components/ui/input'
import { Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { updateReportStatus, resolveReport } from './actions'
import { toast } from 'sonner'
import Link from 'next/link'

interface Report {
  id: string
  type: string
  targetId: string
  reporterId: string
  reason: string
  description: string | null
  status: string
  resolvedAt: string | null
  resolvedBy: string | null
  action: string | null
  createdAt: string
  updatedAt: string
  reporter: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  target: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
}

interface ReportsClientProps {
  initialReports: Report[]
}

export function ReportsClient({ initialReports }: ReportsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [reports, setReports] = useState(initialReports)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; report?: Report }>({ open: false })
  
  const [actionType, setActionType] = useState<'DELETE_CONTENT' | 'SUSPEND_USER' | 'WARN_USER' | 'DISMISS'>('DISMISS')
  const [actionReason, setActionReason] = useState('')
  const [actionDuration, setActionDuration] = useState('')

  const pendingReports = reports.filter(r => r.status === 'PENDING')
  const reviewedReports = reports.filter(r => r.status === 'REVIEWED')
  const resolvedReports = reports.filter(r => r.status === 'RESOLVED')

  const handleStatusChange = async (reportId: string, status: 'REVIEWED' | 'RESOLVED') => {
    startTransition(async () => {
      try {
        const result = await updateReportStatus(reportId, status)
        if (result.success) {
          toast.success(`Report marked as ${status.toLowerCase()}`)
          setReports(prev =>
            prev.map(r => (r.id === reportId ? { ...r, status } : r))
          )
          router.refresh()
        } else {
          toast.error('Failed to update report status')
        }
      } catch (error) {
        toast.error('Failed to update report status')
      }
    })
  }

  const handleResolve = async () => {
    if (!actionDialog.report || !actionReason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    startTransition(async () => {
      try {
        const duration = actionDuration ? parseInt(actionDuration) : undefined
        const result = await resolveReport(
          actionDialog.report!.id,
          actionType,
          actionReason,
          duration
        )
        if (result.success) {
          toast.success('Report resolved successfully')
          setActionDialog({ open: false })
          setActionReason('')
          setActionDuration('')
          setActionType('DISMISS')
          setReports(prev =>
            prev.map(r => (r.id === actionDialog.report!.id ? { ...r, status: 'RESOLVED' } : r))
          )
          router.refresh()
        } else {
          toast.error(result.error || 'Failed to resolve report')
        }
      } catch (error) {
        toast.error('Failed to resolve report')
      }
    })
  }

  const renderReport = (report: Report) => {
    return (
      <Card key={report.id} className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={report.reporter.avatar || undefined} alt={report.reporter.name} />
                <AvatarFallback>{getInitials(report.reporter.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  Reported by {report.reporter.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.reporter.email} • {formatRelativeTime(new Date(report.createdAt))}
                </p>
              </div>
            </div>
            <Badge variant={
              report.status === 'PENDING' ? 'default' :
              report.status === 'REVIEWED' ? 'secondary' : 'outline'
            }>
              {report.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{report.type}</Badge>
                <span className="text-sm text-muted-foreground">
                  Target: {report.target.name}
                </span>
              </div>
              <div>
                <p className="font-medium mb-1">Reason: {report.reason}</p>
                {report.description && (
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {report.type === 'AUCTION' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/auctions/${report.targetId}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Auction
                  </Link>
                </Button>
              )}
              {report.type === 'USER' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/profile/${report.targetId}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </Button>
              )}
              {report.status === 'PENDING' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(report.id, 'REVIEWED')}
                    disabled={isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Reviewed
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setActionDialog({ open: true, report })}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Take Action
                  </Button>
                </>
              )}
              {report.status === 'REVIEWED' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setActionDialog({ open: true, report })}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Take Action
                </Button>
              )}
              {report.status === 'RESOLVED' && report.action && (
                <Badge variant="secondary">
                  Action: {report.action.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports Management</h1>
        <p className="text-muted-foreground mt-1">Review and moderate reported content</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewedReports.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedReports.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length > 0 ? (
            pendingReports.map(renderReport)
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending reports
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="reviewed" className="space-y-4">
          {reviewedReports.length > 0 ? (
            reviewedReports.map(renderReport)
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reviewed reports
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="resolved" className="space-y-4">
          {resolvedReports.length > 0 ? (
            resolvedReports.map(renderReport)
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No resolved reports
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ open })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              Choose an action to resolve this report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action Type</Label>
              <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISMISS">Dismiss Report</SelectItem>
                  <SelectItem value="WARN_USER">Warn User</SelectItem>
                  <SelectItem value="SUSPEND_USER">Suspend User</SelectItem>
                  {actionDialog.report?.type === 'AUCTION' && (
                    <SelectItem value="DELETE_CONTENT">Delete Auction</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                placeholder="Enter reason for this action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
              />
            </div>
            {actionType === 'SUSPEND_USER' && (
              <div>
                <Label>Duration (days, optional)</Label>
                <Input
                  type="number"
                  placeholder="Leave empty for indefinite"
                  value={actionDuration}
                  onChange={(e) => setActionDuration(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isPending || !actionReason.trim()}>
              Execute Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
