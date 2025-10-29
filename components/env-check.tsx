"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ExternalLink } from "lucide-react"

interface EnvStatus {
  supabaseUrl: boolean
  supabaseAnonKey: boolean
}

export function EnvCheck() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== "development") return

    const checkEnv = () => {
      setEnvStatus({
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })
    }

    checkEnv()
    setIsVisible(true)
  }, [])

  if (!isVisible || !envStatus) return null

  const allConfigured = envStatus.supabaseUrl && envStatus.supabaseAnonKey

  if (allConfigured) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="border-red-500">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <div className="font-semibold">
            ❌ Setup Required
          </div>
          <div className="text-sm space-y-1">
            {!envStatus.supabaseUrl && (
              <div className="flex items-center gap-2">
                <span className="text-red-500">•</span>
                <span>NEXT_PUBLIC_SUPABASE_URL missing</span>
              </div>
            )}
            {!envStatus.supabaseAnonKey && (
              <div className="flex items-center gap-2">
                <span className="text-red-500">•</span>
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY missing</span>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => window.open("/SETUP.md", "_blank")}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Setup Guide
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
