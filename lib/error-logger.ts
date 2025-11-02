/**
 * Error logging utility
 * Logs errors to console and optionally to external service
 */

export interface ErrorLog {
  message: string
  stack?: string
  digest?: string
  component?: string
  path?: string
  userAgent?: string
  timestamp: string
  userId?: string
  metadata?: Record<string, unknown>
}

/**
 * Log error with metadata
 */
export async function logError(
  error: Error & { digest?: string },
  metadata?: {
    component?: string
    path?: string
    userId?: string
    [key: string]: unknown
  }
): Promise<void> {
  try {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      component: metadata?.component,
      path: metadata?.path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      userId: metadata?.userId,
      metadata: metadata ? { ...metadata } : undefined
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog)
    }

    // In production, you can send to error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: await sendToErrorService(errorLog)
      // For now, just log to console
      console.error('Production error:', {
        message: errorLog.message,
        digest: errorLog.digest,
        component: errorLog.component,
        path: errorLog.path
      })
    }

    // Optionally: Send to your own API endpoint
    // await fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog)
    // })
  } catch (loggingError) {
    // Fallback: if logging fails, at least log to console
    console.error('Failed to log error:', loggingError)
    console.error('Original error:', error)
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessage(error: Error & { digest?: string }): {
  title: string
  message: string
  type: 'network' | 'auth' | 'database' | 'validation' | 'unknown'
} {
  const errorMessage = error.message.toLowerCase()
  const errorStack = error.stack?.toLowerCase() || ''

  // Network errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')
  ) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      type: 'network'
    }
  }

  // Authentication errors
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('supabase') ||
    errorMessage.includes('session')
  ) {
    return {
      title: 'Authentication Error',
      message: 'Your session has expired or you need to sign in. Please try signing in again.',
      type: 'auth'
    }
  }

  // Database errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('prisma') ||
    errorMessage.includes('sql') ||
    errorMessage.includes('unique constraint') ||
    errorMessage.includes('foreign key')
  ) {
    return {
      title: 'Data Error',
      message: 'There was an issue processing your request. Please try again, or contact support if the problem persists.',
      type: 'database'
    }
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('zod') ||
    errorMessage.includes('required')
  ) {
    return {
      title: 'Validation Error',
      message: 'Please check your input and try again.',
      type: 'validation'
    }
  }

  // Default
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    type: 'unknown'
  }
}

