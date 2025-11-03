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

interface AuctionWonEmailProps {
  userName: string
  auctionTitle: string
  winningBid: number
  auctionId: string
  auctionImage?: string
  endTime: string
  baseUrl?: string
}

export function AuctionWonEmail({
  userName,
  auctionTitle,
  winningBid,
  auctionId,
  auctionImage,
  endTime,
  baseUrl = 'http://localhost:3000',
}: AuctionWonEmailProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(winningBid)

  return (
    <Html>
      <Head />
      <Preview>Congratulations! You won "{auctionTitle}" for {formattedAmount}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerHeading}>Bid Master University</Heading>
            <Text style={headerSubtext}>Auction Platform for Students</Text>
          </Section>

          <Section style={content}>
            <Heading style={winHeading}>🎉 Congratulations!</Heading>
            
            <Text style={paragraph}>Hi {userName},</Text>

            <Text style={paragraph}>
              Great news! You won the auction for:
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
              <Heading style={auctionTitleStyle}>{auctionTitle}</Heading>
              <Text style={auctionInfo}>
                Winning Bid: <strong style={winPrice}>{formattedAmount}</strong>
              </Text>
              <Text style={auctionInfo}>Ended: {endTime}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={`${baseUrl}/auctions/${auctionId}`}>
                View Details
              </Button>
            </Section>

            <Text style={paragraph}>Please contact the seller to arrange payment and item pickup.</Text>

            <Text style={sectionTitle}>Next steps:</Text>
            <ul style={list}>
              <li>Contact the seller via messages</li>
              <li>Arrange payment method</li>
              <li>Schedule item pickup or delivery</li>
            </ul>
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

const winHeading = {
  color: '#10b981',
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

const auctionTitleStyle = {
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

const winPrice = {
  color: '#10b981',
  fontSize: '16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const sectionTitle = {
  color: '#333333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '20px 0 10px 0',
}

const list = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  paddingLeft: '20px',
  margin: '16px 0',
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

export default AuctionWonEmail

