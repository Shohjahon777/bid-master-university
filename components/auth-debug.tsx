'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function AuthDebug() {
  const { user, loading, isAuthenticated } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Auth Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <Badge variant={loading ? 'secondary' : isAuthenticated ? 'default' : 'destructive'}>
            {loading ? 'Loading' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Badge>
        </div>
        {user && (
          <>
            <div>
              <span className="font-medium">User ID:</span> {user.id}
            </div>
            <div>
              <span className="font-medium">Name:</span> {user.name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">University:</span> {user.university || 'None'}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
