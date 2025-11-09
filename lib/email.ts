'use server'

import { Resend } from 'resend'
import { render } from '@react-email/render'
import { db } from '@/lib/db'
import { formatCurrency, formatDate, formatDateTime, getTimeRemaining } from '@/lib/utils'
import type { User, Auction } from '@prisma/client'
import { WelcomeEmail } from '@/components/emails/welcome-email'
import { BidNotification } from '@/components/emails/bid-notification'
import { OutbidNotification } from '@/components/emails/outbid-notification'
import { AuctionWonEmail } from '@/components/emails/auction-won-email'
import { AuctionEndingEmail } from '@/components/emails/auction-ending-email'
import { env } from '@/lib/config/env'

// Initialize Resend client
const resend = env.resendApiKey
  ? new Resend(env.resendApiKey)
  : null

// Email configuration
// For Resend, use 'onboarding@resend.dev' for testing or a verified domain
// You can verify a domain in Resend dashboard to use custom email
const fromEmail = env.emailFrom
const baseUrl = env.baseUrl

/**
 * Log email send attempt to database
 */
async function logEmail(
  to: string,
  subject: string,
  type: string,
  status: 'PENDING' | 'SENT' | 'FAILED',
  error?: string,
  userId?: string
) {
  try {
    // Use type assertion since Prisma client may not have generated yet
    await (db as any).emailLog.create({
      data: {
        to,
        subject,
        type,
        status,
        error: error || null,
        sentAt: status === 'SENT' ? new Date() : null,
        userId: userId || null
      }
    })
  } catch (error) {
    console.error('Error logging email:', error)
  }
}

/**
 * Base email send function
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  type: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured. Email not sent.')
    await logEmail(to, subject, type, 'FAILED', 'Resend API key not configured', userId)
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text
    })

    if (error) {
      console.error('Error sending email:', error)
      await logEmail(to, subject, type, 'FAILED', error.message || 'Unknown error', userId)
      return { success: false, error: error.message || 'Failed to send email' }
    }

    await logEmail(to, subject, type, 'SENT', undefined, userId)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error sending email:', error)
    await logEmail(to, subject, type, 'FAILED', errorMessage, userId)
    return { success: false, error: errorMessage }
  }
}

/**
 * Generate plain text version from HTML
 */
function htmlToText(html: string): string {
  // Simple HTML to text conversion (remove HTML tags)
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n\n') // Remove excessive newlines
    .trim()
}

/**
 * Generate email HTML template wrapper (for emails that don't use React Email yet)
 */
function emailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bid Master University</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Bid Master University</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Auction Platform for Students</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          ${content}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Bid Master University. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `
}

/**
 * Welcome email (sent on registration)
 */
export async function sendWelcomeEmail(user: User) {
  const subject = 'Welcome to Bid Master University!'
  const html = await render(WelcomeEmail({ userName: user.name, baseUrl }))
  const text = htmlToText(html)

  return sendEmail(user.email, subject, html, text, 'WELCOME', user.id)
}

/**
 * Email verification
 */
export async function sendVerificationEmail(user: User, token: string) {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`
  const subject = 'Verify Your Email Address'
  const html = emailTemplate(`
    <h2 style="color: #667eea; margin-top: 0;">Verify Your Email</h2>
    <p>Hi ${user.name},</p>
    <p>Please verify your email address to complete your registration. Click the button below to verify:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
    <p style="color: #ef4444; font-size: 14px;"><strong>This link will expire in 24 hours.</strong></p>
  `)
  const text = `
Verify Your Email

Hi ${user.name},

Please verify your email address to complete your registration.

Visit this link to verify: ${verificationUrl}

This link will expire in 24 hours.
  `

  return sendEmail(user.email, subject, html, text, 'VERIFICATION', user.id)
}

/**
 * Bid placed notification
 */
export async function sendBidNotification(user: User, auction: Auction, bidAmount: number) {
  const subject = `Bid Placed on "${auction.title}"`
  const html = await render(
    BidNotification({
      userName: user.name,
      auctionTitle: auction.title,
      bidAmount,
      auctionId: auction.id,
      auctionImage: auction.images?.[0],
      endTime: formatDateTime(auction.endTime),
      baseUrl
    })
  )
  const text = htmlToText(html)

  return sendEmail(user.email, subject, html, text, 'BID_PLACED', user.id)
}

/**
 * Outbid notification
 */
export async function sendOutbidNotification(user: User, auction: Auction, newBidAmount: number) {
  const subject = `You Were Outbid on "${auction.title}"`
  const html = await render(
    OutbidNotification({
      userName: user.name,
      auctionTitle: auction.title,
      newBidAmount,
      auctionId: auction.id,
      auctionImage: auction.images?.[0],
      endTime: formatDateTime(auction.endTime),
      baseUrl
    })
  )
  const text = htmlToText(html)

  return sendEmail(user.email, subject, html, text, 'OUTBID', user.id)
}

/**
 * Auction won notification
 */
export async function sendAuctionWonEmail(user: User, auction: Auction) {
  const subject = `Congratulations! You Won "${auction.title}"`
  const html = await render(
    AuctionWonEmail({
      userName: user.name,
      auctionTitle: auction.title,
      winningBid: Number(auction.currentPrice),
      auctionId: auction.id,
      auctionImage: auction.images?.[0],
      endTime: formatDateTime(auction.endTime),
      baseUrl
    })
  )
  const text = htmlToText(html)

  return sendEmail(user.email, subject, html, text, 'AUCTION_WON', user.id)
}

/**
 * Auction ending reminder
 */
export async function sendAuctionEndingEmail(user: User, auction: Auction, timeRemaining: string) {
  const subject = `Reminder: "${auction.title}" Ending Soon!`
  const html = await render(
    AuctionEndingEmail({
      userName: user.name,
      auctionTitle: auction.title,
      currentPrice: Number(auction.currentPrice),
      timeRemaining,
      auctionId: auction.id,
      auctionImage: auction.images?.[0],
      endTime: formatDateTime(auction.endTime),
      baseUrl
    })
  )
  const text = htmlToText(html)

  return sendEmail(user.email, subject, html, text, 'AUCTION_ENDING', user.id)
}

/**
 * New message notification
 */
export async function sendNewMessageEmail(user: User, senderName: string, messagePreview: string) {
  const messagesUrl = `${baseUrl}/messages`
  const subject = `New Message from ${senderName}`
  const html = emailTemplate(`
    <h2 style="color: #667eea; margin-top: 0;">New Message</h2>
    <p>Hi ${user.name},</p>
    <p>You have a new message from <strong>${senderName}</strong>:</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <p style="color: #111827; margin: 0; font-style: italic;">"${messagePreview}"</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${messagesUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Messages</a>
    </div>
  `)
  const text = `
New Message

Hi ${user.name},

You have a new message from ${senderName}:

"${messagePreview}"

Visit ${messagesUrl} to view and reply.
  `

  return sendEmail(user.email, subject, html, text, 'NEW_MESSAGE', user.id)
}

/**
 * Password reset email
 */
export async function sendPasswordResetEmail(user: User, resetToken: string) {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
  const subject = 'Reset Your Password'
  const html = emailTemplate(`
    <h2 style="color: #667eea; margin-top: 0;">Password Reset Request</h2>
    <p>Hi ${user.name},</p>
    <p>We received a request to reset your password. Click the button below to reset it:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${resetUrl}</p>
    <p style="color: #ef4444; font-size: 14px;"><strong>This link will expire in 1 hour.</strong></p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `)
  const text = `
Password Reset Request

Hi ${user.name},

We received a request to reset your password.

Visit this link to reset: ${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
  `

  return sendEmail(user.email, subject, html, text, 'PASSWORD_RESET', user.id)
}

