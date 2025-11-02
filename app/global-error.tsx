'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, RefreshCw, Mail } from 'lucide-react'
import { logError, getErrorMessage } from '@/lib/error-logger'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error boundary - catches errors in root layout
 * This is the last resort error handler
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter()
  const errorInfo = getErrorMessage(error)

  useEffect(() => {
    // Log error with highest priority
    logError(error, {
      component: 'global-root-error',
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      severity: 'critical'
    })
  }, [error])

  const handleReportIssue = () => {
    const subject = encodeURIComponent(`Critical Error: ${errorInfo.title}`)
    const body = encodeURIComponent(
      `Critical Error Report:\n\n` +
      `Message: ${error.message}\n` +
      `Digest: ${error.digest || 'N/A'}\n` +
      `Path: ${typeof window !== 'undefined' ? window.location.pathname : 'N/A'}\n` +
      `User Agent: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}\n` +
      `Timestamp: ${new Date().toISOString()}\n\n` +
      `Please describe what you were doing when this error occurred:\n`
    )
    
    window.location.href = `mailto:support@bidmaster.edu?subject=${subject}&body=${body}`
  }

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg border-destructive">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">
                Critical Error
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {errorInfo.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {errorInfo.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This is a critical error. Please report it to help us fix the issue.
                </p>
              </div>

              {/* Error details */}
              <div className="rounded-lg bg-muted p-4">
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs bg-background p-3 rounded overflow-auto max-h-48">
                    {error.message}
                    {error.digest && `\n\nDigest: ${error.digest}`}
                    {error.stack && `\n\nStack:\n${error.stack}`}
                  </pre>
                </details>
              </div>

              {/* Action buttons */}
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
                  variant="destructive"
                  onClick={handleReportIssue}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Report Issue
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                <p>
                  If this problem persists, please contact support with the error details above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}

