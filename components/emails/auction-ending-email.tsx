import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Img,
} from '@react-email/components'
import * as React from 'react'

interface AuctionEndingEmailProps {
  userName: string
  auctionTitle: string
  currentPrice: number
  timeRemaining: string
  auctionId: string
  auctionImage?: string
  endTime: string
  baseUrl?: string
}

export function AuctionEndingEmail({
  userName,
  auctionTitle,
  currentPrice,
  timeRemaining,
  auctionId,
  auctionImage,
  endTime,
  baseUrl = 'http://localhost:3000',
}: AuctionEndingEmailProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(currentPrice)

  return (
    <Html>
      <Head />
      <Preview>Reminder: "{auctionTitle}" is ending soon! Time remaining: {timeRemaining}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerHeading}>Bid Master University</Heading>
            <Text style={headerSubtext}>Auction Platform for Students</Text>
          </Section>

          <Section style={content}>
            <Heading style={reminderHeading}>⏰ Auction Ending Soon!</Heading>
            
            <Text style={paragraph}>Hi {userName},</Text>

            <Text style={paragraph}>
              This is a reminder that an auction you're watching is ending soon:
            </Text>

            <Section style={auctionCard}>
              {auctionImage && (
                <Img
                  src={auctionImage}
                  alt={auctionTitle}
                  width="100%"
                  style={auctionImageStyle}
                />
              )}
              <Heading style={auctionTitle}>{auctionTitle}</Heading>
              <Text style={auctionInfo}>
                Current Price: <strong style={price}>{formattedAmount}</strong>
              </Text>
              <Text style={timeRemainingText}>
                ⏰ Time Remaining: <strong style={timeHighlight}>{timeRemaining}</strong>
              </Text>
              <Text style={auctionInfo}>Ends: {endTime}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={`${baseUrl}/auctions/${auctionId}`}>
                Place Your Bid Now
              </Button>
            </Section>

            <Text style={warningText}>
              Don't miss out! Make sure your bid is in before the auction ends.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Bid Master University. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '30px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
}

const headerHeading = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const headerSubtext = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '14px',
  margin: '10px 0 0 0',
}

const content = {
  padding: '30px',
}

const reminderHeading = {
  color: '#f59e0b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
}

const paragraph = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const auctionCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}

const auctionImageStyle = {
  borderRadius: '6px',
  marginBottom: '15px',
  maxWidth: '100%',
}

const auctionTitle = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
}

const auctionInfo = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '5px 0',
}

const price = {
  color: '#667eea',
  fontSize: '16px',
}

const timeRemainingText = {
  color: '#f59e0b',
  fontSize: '14px',
  margin: '5px 0',
  fontWeight: 'bold',
}

const timeHighlight = {
  color: '#f59e0b',
  fontSize: '16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const warningText = {
  color: '#ef4444',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '20px 0',
  textAlign: 'center' as const,
}

const footer = {
  borderTop: '1px solid #e5e7eb',
  marginTop: '30px',
  paddingTop: '20px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
}

export default AuctionEndingEmail

