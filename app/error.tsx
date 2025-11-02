'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, RefreshCw, Mail, AlertCircle } from 'lucide-react'
import { logError, getErrorMessage } from '@/lib/error-logger'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter()
  const errorInfo = getErrorMessage(error)

  useEffect(() => {
    // Log error
    logError(error, {
      component: 'global-error-boundary',
      path: typeof window !== 'undefined' ? window.location.pathname : undefined
    })
  }, [error])

  const handleReportIssue = () => {
    const subject = encodeURIComponent(`Error Report: ${errorInfo.title}`)
    const body = encodeURIComponent(
      `Error Details:\n\n` +
      `Message: ${error.message}\n` +
      `Digest: ${error.digest || 'N/A'}\n` +
      `Path: ${typeof window !== 'undefined' ? window.location.pathname : 'N/A'}\n` +
      `Timestamp: ${new Date().toISOString()}\n\n` +
      `Please describe what you were doing when this error occurred:\n`
    )
    
    window.location.href = `mailto:support@bidmaster.edu?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            {errorInfo.type === 'network' ? (
              <AlertCircle className="h-8 w-8 text-destructive" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {errorInfo.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-muted p-4">
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-background p-3 rounded overflow-auto max-h-48">
                  {error.message}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                  {error.stack && `\n\nStack:\n${error.stack}`}
                </pre>
              </details>
            </div>
          )}

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
              variant="outline"
              onClick={handleReportIssue}
              className="flex-1"
            >
              <Mail className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
          </div>

          {/* Helpful links */}
          <div className="text-center text-sm text-muted-foreground pt-2">
            <p>
              Need help?{' '}
              <a
                href="/how-it-works"
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/how-it-works')
                }}
              >
                Learn how it works
              </a>
              {' or '}
              <button
                onClick={handleReportIssue}
                className="text-primary hover:underline"
              >
                contact support
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
