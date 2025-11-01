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

interface WelcomeEmailProps {
  name: string;
  dashboardUrl: string;
}

export default function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Vítejte v ClaimBuddy - Začněte už dnes!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Vítejte v ClaimBuddy! 🎉</Heading>

          <Text style={paragraph}>Dobrý den {name},</Text>

          <Text style={paragraph}>
            Děkujeme, že jste se k nám připojili! ClaimBuddy vám pomůže efektivně
            spravovat vaše pojistné události a maximalizovat pojistné plnění.
          </Text>

          <Heading style={subheading}>Jak začít:</Heading>

          <Section style={list}>
            <Text style={listItem}>
              <strong>1. Vytvořte svůj první případ</strong>
              <br />
              Přejděte do dashboardu a vyplňte detaily vaší pojistné události
            </Text>

            <Text style={listItem}>
              <strong>2. Nahrajte dokumenty</strong>
              <br />
              Přiložte faktury, fotografie a další důkazy
            </Text>

            <Text style={listItem}>
              <strong>3. Sledujte průběh</strong>
              <br />
              Buďte v kontaktu s naším týmem a sledujte aktualizace v reálném čase
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Přejít do dashboardu
            </Button>
          </Section>

          <Text style={paragraph}>
            Máte-li jakékoliv otázky, neváhejte nás kontaktovat.
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

const list = {
  padding: '0 48px',
};

const listItem = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#4b5563',
  marginBottom: '16px',
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
