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

interface CaseCreatedEmailProps {
  name: string;
  caseNumber: string;
  caseId: string;
  insuranceType: string;
  caseUrl: string;
}

export default function CaseCreatedEmail({
  name,
  caseNumber,
  insuranceType,
  caseUrl,
}: CaseCreatedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Váš případ #{caseNumber} byl vytvořen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Případ vytvořen ✓</Heading>

          <Text style={paragraph}>Dobrý den {name},</Text>

          <Text style={paragraph}>
            Váš případ byl úspěšně vytvořen a náš tým na něm začne okamžitě
            pracovat.
          </Text>

          <Section style={caseInfo}>
            <Text style={caseInfoItem}>
              <strong>Číslo případu:</strong> {caseNumber}
            </Text>
            <Text style={caseInfoItem}>
              <strong>Typ pojištění:</strong> {insuranceType}
            </Text>
          </Section>

          <Heading style={subheading}>Co bude následovat:</Heading>

          <Section style={list}>
            <Text style={listItem}>
              ✓ Náš tým provedl první analýzu vašeho případu
            </Text>
            <Text style={listItem}>
              ⏳ Do 24 hodin vás kontaktujeme s dalšími kroky
            </Text>
            <Text style={listItem}>
              📊 Očekávaná doba vyřízení: 14-21 dní
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={caseUrl}>
              Zobrazit detail případu
            </Button>
          </Section>

          <Text style={paragraph}>
            V případě dotazů nás můžete kontaktovat přímo v dashboardu přes chat.
          </Text>

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

const caseInfo = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 48px',
};

const caseInfoItem = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#1f2937',
  marginBottom: '8px',
};

const list = {
  padding: '0 48px',
};

const listItem = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#4b5563',
  marginBottom: '12px',
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
