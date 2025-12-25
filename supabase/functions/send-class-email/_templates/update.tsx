import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface UpdateEmailProps {
  userName: string
  classTitle: string
  bookTitle: string
  bookAuthor: string
  hostName: string
  scheduledDate: string
  duration: number
  platform: string
  joinUrl: string
  classDescription?: string
}

export const UpdateEmail = ({
  userName,
  classTitle,
  bookTitle,
  bookAuthor,
  hostName,
  scheduledDate,
  duration,
  platform,
  joinUrl,
  classDescription,
}: UpdateEmailProps) => (
  <Html>
    <Head />
    <Preview>"{classTitle}" has been updated</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📝 Class Updated</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>
        
        <Text style={text}>
          The host has updated the details for a class you're registered for. Please review the updated information below:
        </Text>

        <Section style={classCard}>
          <Heading style={h2}>{classTitle}</Heading>
          
          <Text style={detailText}>
            📚 <strong>Book:</strong> {bookTitle} by {bookAuthor}
          </Text>
          
          <Text style={detailText}>
            👤 <strong>Host:</strong> {hostName}
          </Text>
          
          <Text style={detailText}>
            📅 <strong>Date & Time:</strong> {scheduledDate}
          </Text>
          
          <Text style={detailText}>
            ⏱️ <strong>Duration:</strong> {duration} minutes
          </Text>
          
          <Text style={detailText}>
            💻 <strong>Platform:</strong> {platform}
          </Text>
          
          {classDescription && (
            <Text style={descriptionText}>
              {classDescription}
            </Text>
          )}
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={joinUrl}>
            View Class Details
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          <strong>Updated Join Link:</strong>{' '}
          <Link href={joinUrl} style={link}>
            {joinUrl}
          </Link>
        </Text>

        <Text style={noteText}>
          If you have any questions about these changes, please contact the host directly.
        </Text>

        <Text style={footer}>
          Happy reading! 📖
          <br />
          The BookCrossing Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default UpdateEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 30px',
}

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const detailText = {
  color: '#484848',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
}

const descriptionText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0 0',
  fontStyle: 'italic' as const,
}

const noteText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0',
  fontStyle: 'italic' as const,
}

const classCard = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #fbbf24',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const link = {
  color: '#f59e0b',
  textDecoration: 'underline',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
}
