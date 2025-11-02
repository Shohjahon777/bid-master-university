'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function TestAuthPage() {
  const { user, loading, isAuthenticated, signOut } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <Badge variant={loading ? 'secondary' : isAuthenticated ? 'default' : 'destructive'}>
              {loading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
          </div>

          {user ? (
            <div className="space-y-2">
              <h3 className="font-semibold">User Information:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Name:</strong> {user.name}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>University:</strong> {user.university || 'None'}</div>
                <div><strong>Verified:</strong> {user.verified ? 'Yes' : 'No'}</div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button asChild>
                  <Link href="/auctions/new">Create Auction</Link>
                </Button>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p>You are not authenticated.</p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
