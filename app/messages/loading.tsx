import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

function ConversationListSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Sidebar - Conversations List */}
      <div className="flex flex-col w-full lg:w-[30%] border-r bg-background">
        {/* Search */}
        <div className="p-4 border-b">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border"
              >
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="w-5 h-5 rounded-full" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Chat */}
      <div className="hidden lg:flex flex-col flex-1 bg-muted/30">
        {/* Conversation Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    i % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  <Skeleton className={`h-4 w-full mb-1 ${i % 2 === 0 ? 'bg-primary-foreground/20' : ''}`} />
                  <Skeleton className={`h-3 w-16 ${i % 2 === 0 ? 'bg-primary-foreground/20' : ''}`} />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Mobile/Tablet - Full conversation list */}
      <div className="flex lg:hidden flex-col w-full">
        <ConversationListSkeleton />
      </div>

      {/* Desktop - Two column layout */}
      <div className="hidden lg:flex w-full">
        <ConversationListSkeleton />
      </div>
    </div>
  )
}

