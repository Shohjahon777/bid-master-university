'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, RefreshCw, Mail, Gavel, ArrowLeft } from 'lucide-react'
import { logError, getErrorMessage } from '@/lib/error-logger'
import Link from 'next/link'

interface AuctionsErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AuctionsError({ error, reset }: AuctionsErrorProps) {
  const router = useRouter()
  const errorInfo = getErrorMessage(error)

  useEffect(() => {
    logError(error, {
      component: 'auctions-error-boundary',
      path: '/auctions'
    })
  }, [error])

  const handleReportIssue = () => {
    const subject = encodeURIComponent(`Auctions Page Error: ${errorInfo.title}`)
    const body = encodeURIComponent(
      `Error on Auctions Page:\n\n` +
      `Message: ${error.message}\n` +
      `Digest: ${error.digest || 'N/A'}\n` +
      `Timestamp: ${new Date().toISOString()}\n\n` +
      `What were you trying to do?\n` +
      `- Browse auctions\n` +
      `- Search for items\n` +
      `- Filter auctions\n` +
      `- Other: [describe]\n\n` +
      `Additional details:\n`
    )
    
    window.location.href = `mailto:support@bidmaster.edu?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Gavel className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Auctions Error</CardTitle>
          <CardDescription>
            We couldn't load the auctions page. This might be a temporary issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {errorInfo.message}
            </p>
            {errorInfo.type === 'network' && (
              <p className="text-xs text-muted-foreground">
                Please check your internet connection and try again.
              </p>
            )}
          </div>

          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs bg-muted p-3 rounded">
              <summary className="cursor-pointer font-semibold mb-2">
                Error Details
              </summary>
              <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-32">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1"
            >
              <Link href="/auctions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Auctions
              </Link>
            </Button>
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReportIssue}
              className="w-full"
            >
              <Mail className="mr-2 h-3 w-3" />
              Report This Issue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

