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

interface WelcomeEmailProps {
  userName: string
  baseUrl?: string
}

export function WelcomeEmail({ userName, baseUrl = 'http://localhost:3000' }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Bid Master University! Start bidding on auctions now.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerHeading}>Bid Master University</Heading>
            <Text style={headerSubtext}>Auction Platform for Students</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Welcome, {userName}!</Heading>
            
            <Text style={paragraph}>
              Thank you for joining Bid Master University! We're excited to have you on board.
            </Text>

            <Text style={paragraph}>
              You can now:
            </Text>

            <ul style={list}>
              <li>Browse and bid on auctions</li>
              <li>Create your own auctions</li>
              <li>Connect with other students</li>
              <li>Build your reputation</li>
            </ul>

            <Section style={buttonContainer}>
              <Button style={button} href={`${baseUrl}/auctions`}>
                Browse Auctions
              </Button>
            </Section>

            <Text style={paragraph}>
              If you have any questions, feel free to reach out to our support team.
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

const heading = {
  color: '#667eea',
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

const list = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  paddingLeft: '20px',
  margin: '16px 0',
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

export default WelcomeEmail

