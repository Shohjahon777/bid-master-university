import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getUserById } from '@/lib/auth'
import { generateProfileMetadata } from '@/lib/metadata'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

interface ProfilePageProps {
  params: Promise<{
    userId: string
  }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { userId } = await params
  const user = await getUserById(userId)
  
  if (!user) {
    return {
      title: 'Profile Not Found - Bid Master',
      description: 'The profile you are looking for does not exist.',
    }
  }

  return generateProfileMetadata(user)
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params
  const user = await getUserById(userId)

  if (!user) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl flex items-center gap-2">
                {user.name}
                {user.verified && (
                  <Badge variant="default" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardTitle>
              {user.university && (
                <CardDescription className="text-lg mt-2">
                  {user.university}
                </CardDescription>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a public profile page. More information and user activity will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

