"use client"

import { useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error boundary caught:", error)
  }, [error])

  const isSupabaseError = error.message.includes("Supabase") || 
                         error.message.includes("supabaseKey") ||
                         error.message.includes("environment variables")

  if (isSupabaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-700">Setup Required</AlertTitle>
            <AlertDescription className="space-y-4">
              <div className="text-sm">
                <p className="mb-2">The application needs to be configured with Supabase credentials.</p>
                <p className="font-semibold">To fix this:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-xs">
                  <li>Create a Supabase project at supabase.com</li>
                  <li>Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file</li>
                  <li>Add your Supabase credentials</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open("/SETUP.md", "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Setup Guide
                </Button>
                <Button
                  size="sm"
                  onClick={reset}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Generic error fallback
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert className="border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-red-700">Something went wrong</AlertTitle>
          <AlertDescription className="space-y-4">
            <div className="text-sm">
              <p>An unexpected error occurred. Please try again.</p>
              {process.env.NODE_ENV === "development" && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold">
                    Error Details
                  </summary>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}
            </div>
            <Button size="sm" onClick={reset}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
