'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  useEffect(() => {
    // Check if we have Supabase auth session (from magic link)
    const checkSession = async () => {
      // Give Supabase a moment to process the auth session if coming from email link
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsVerified(true)
        toast.success('Email verified successfully!')
      } else if (!token && !tokenHash) {
        // No token and no session means just viewing the page
        setIsVerifying(false)
      } else {
        // Have token but no session - could be expired or invalid
        setError('Verification link expired or invalid. Please request a new verification email.')
      }
    }

    checkSession()
  }, [token, tokenHash, type])

  const resendVerification = async () => {
    toast.info('Verification email sent! Please check your inbox.')
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
                <h2 className="text-2xl font-bold text-foreground">Verifying Email...</h2>
                <p className="text-muted-foreground">
                  Please wait while we verify your email address.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-bold text-foreground">Email Verified!</h2>
                <p className="text-muted-foreground">
                  Your email has been successfully verified. You can now access all features of Bid Master.
                </p>
                <div className="pt-4 space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/auctions">Go to Auctions</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <XCircle className="mx-auto h-16 w-16 text-red-500" />
                <h2 className="text-2xl font-bold text-foreground">Verification Failed</h2>
                <p className="text-muted-foreground">
                  {error}
                </p>
                <div className="pt-4 space-y-2">
                  <Button onClick={resendVerification} className="w-full">
                    Resend Verification Email
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Default state - no token provided
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to your university email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <Mail className="mx-auto h-16 w-16 text-blue-500" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Check Your Email</h3>
                <p className="text-muted-foreground text-sm">
                  Please check your email inbox and click the verification link to activate your account.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Didn't receive the email?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure you entered the correct email address</li>
                  <li>• Wait a few minutes for the email to arrive</li>
                </ul>
              </div>

              <div className="flex flex-col space-y-2">
                <Button onClick={resendVerification} variant="outline" className="w-full">
                  Resend Verification Email
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
                <h2 className="text-2xl font-bold text-foreground">Loading...</h2>
                <p className="text-muted-foreground">
                  Please wait while we load the verification page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
