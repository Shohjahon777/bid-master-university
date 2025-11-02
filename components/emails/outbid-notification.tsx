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

interface OutbidNotificationProps {
  userName: string
  auctionTitle: string
  newBidAmount: number
  auctionId: string
  auctionImage?: string
  endTime: string
  baseUrl?: string
}

export function OutbidNotification({
  userName,
  auctionTitle,
  newBidAmount,
  auctionId,
  auctionImage,
  endTime,
  baseUrl = 'http://localhost:3000',
}: OutbidNotificationProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(newBidAmount)

  return (
    <Html>
      <Head />
      <Preview>You were outbid on "{auctionTitle}" - New highest bid: {formattedAmount}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerHeading}>Bid Master University</Heading>
            <Text style={headerSubtext}>Auction Platform for Students</Text>
          </Section>

          <Section style={content}>
            <Heading style={outbidHeading}>You Were Outbid!</Heading>
            
            <Text style={paragraph}>Hi {userName},</Text>

            <Text style={paragraph}>
              Someone has placed a higher bid on an auction you were bidding on:
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
                New Highest Bid: <strong style={outbidPrice}>{formattedAmount}</strong>
              </Text>
              <Text style={auctionInfo}>Ends: {endTime}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={`${baseUrl}/auctions/${auctionId}`}>
                Place New Bid
              </Button>
            </Section>

            <Text style={warningText}>
              Don't miss out! Place a higher bid to stay in the running.
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

const outbidHeading = {
  color: '#ef4444',
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

const outbidPrice = {
  color: '#ef4444',
  fontSize: '16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#667eea',
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

export default OutbidNotification

