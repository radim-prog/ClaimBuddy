import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface MessageReceivedEmailProps {
  name: string;
  caseNumber: string;
  senderName: string;
  messagePreview: string;
  caseUrl: string;
}

export default function MessageReceivedEmail({
  name,
  caseNumber,
  senderName,
  messagePreview,
  caseUrl,
}: MessageReceivedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nová zpráva k případu #{caseNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Nová zpráva 💬</Heading>

          <Text style={paragraph}>Dobrý den {name},</Text>

          <Text style={paragraph}>
            Máte novou zprávu od {senderName} k případu #{caseNumber}.
          </Text>

          <Section style={messageBox}>
            <Text style={messageLabel}>Náhled zprávy:</Text>
            <Text style={messageText}>{messagePreview}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={caseUrl}>
              Odpovědět na zprávu
            </Button>
          </Section>

          <Text style={footer}>
            S přáním hezkého dne,
            <br />
            Tým ClaimBuddy
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#1f2937',
  padding: '0 48px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#4b5563',
  padding: '0 48px',
};

const messageBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 48px',
};

const messageLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  marginBottom: '8px',
};

const messageText = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#1f2937',
};

const buttonContainer = {
  padding: '27px 48px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const footer = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#6b7280',
  padding: '0 48px',
  marginTop: '32px',
};
