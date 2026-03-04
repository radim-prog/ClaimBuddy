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

interface CaseUpdatedEmailProps {
  name: string;
  caseNumber: string;
  oldStatus: string;
  newStatus: string;
  comment?: string;
  caseUrl: string;
}

export default function CaseUpdatedEmail({
  name,
  caseNumber,
  oldStatus,
  newStatus,
  comment,
  caseUrl,
}: CaseUpdatedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Aktualizace případu #{caseNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Aktualizace případu</Heading>

          <Text style={paragraph}>Dobrý den {name},</Text>

          <Text style={paragraph}>
            Máme pro vás aktualizaci ohledně vašeho případu #{caseNumber}.
          </Text>

          <Section style={statusBox}>
            <Text style={statusText}>
              <span style={oldStatusStyle}>{oldStatus}</span>
              {' → '}
              <span style={newStatusStyle}>{newStatus}</span>
            </Text>
          </Section>

          {comment && (
            <>
              <Heading style={subheading}>Komentář od týmu:</Heading>
              <Section style={commentBox}>
                <Text style={commentText}>{comment}</Text>
              </Section>
            </>
          )}

          <Heading style={subheading}>Další kroky:</Heading>

          <Text style={paragraph}>
            {newStatus === 'Vyřešeno'
              ? 'Váš případ byl úspěšně vyřešen. Děkujeme za důvěru!'
              : 'Budeme vás průběžně informovat o dalším vývoji.'}
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={caseUrl}>
              Zobrazit detail
            </Button>
          </Section>

          <Text style={footer}>
            S přáním hezkého dne,
            <br />
            Tým Pojistná Pomoc
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

const subheading = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#374151',
  padding: '0 48px',
  marginTop: '32px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#4b5563',
  padding: '0 48px',
};

const statusBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 48px',
  textAlign: 'center' as const,
};

const statusText = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1f2937',
};

const oldStatusStyle = {
  color: '#6b7280',
  textDecoration: 'line-through',
};

const newStatusStyle = {
  color: '#2563eb',
};

const commentBox = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #2563eb',
  borderRadius: '4px',
  padding: '16px 24px',
  margin: '16px 48px',
};

const commentText = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#1f2937',
  fontStyle: 'italic',
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
