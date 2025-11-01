import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface PaymentReceiptEmailProps {
  name: string;
  caseNumber: string;
  amount: number;
  date: string;
  paymentMethod: string;
  invoiceUrl: string;
}

export default function PaymentReceiptEmail({
  name,
  caseNumber,
  amount,
  date,
  paymentMethod,
  invoiceUrl,
}: PaymentReceiptEmailProps) {
  const successFee = amount * 0.15;
  const formattedAmount = new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(amount);
  const formattedFee = new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(successFee);

  return (
    <Html>
      <Head />
      <Preview>Potvrzení platby - Případ #{caseNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Potvrzení platby ✓</Heading>

          <Text style={paragraph}>Dobrý den {name},</Text>

          <Text style={paragraph}>
            Děkujeme za vaši platbu. Níže naleznete detaily transakce.
          </Text>

          <Section style={receiptBox}>
            <Heading style={receiptHeading}>Detaily platby</Heading>

            <Hr style={divider} />

            <table style={table}>
              <tr>
                <td style={labelCell}>Případ:</td>
                <td style={valueCell}>#{caseNumber}</td>
              </tr>
              <tr>
                <td style={labelCell}>Datum platby:</td>
                <td style={valueCell}>{date}</td>
              </tr>
              <tr>
                <td style={labelCell}>Metoda platby:</td>
                <td style={valueCell}>{paymentMethod}</td>
              </tr>
            </table>

            <Hr style={divider} />

            <table style={table}>
              <tr>
                <td style={labelCell}>Částka pojistného plnění:</td>
                <td style={valueCell}>{formattedAmount}</td>
              </tr>
              <tr>
                <td style={labelCell}>Success fee (15%):</td>
                <td style={valueCell}>{formattedFee}</td>
              </tr>
            </table>

            <Hr style={divider} />

            <table style={table}>
              <tr>
                <td style={totalLabelCell}>Celkem zaplaceno:</td>
                <td style={totalValueCell}>{formattedFee}</td>
              </tr>
            </table>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={invoiceUrl}>
              Stáhnout fakturu (PDF)
            </Button>
          </Section>

          <Text style={paragraph}>
            Máte-li jakékoliv dotazy k této platbě, neváhejte nás kontaktovat.
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#4b5563',
  padding: '0 48px',
};

const receiptBox = {
  backgroundColor: '#ffffff',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  padding: '32px',
  margin: '24px 48px',
};

const receiptHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '16px',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const table = {
  width: '100%',
  marginBottom: '16px',
};

const labelCell = {
  fontSize: '14px',
  color: '#6b7280',
  paddingBottom: '8px',
};

const valueCell = {
  fontSize: '14px',
  color: '#1f2937',
  fontWeight: '500',
  textAlign: 'right' as const,
  paddingBottom: '8px',
};

const totalLabelCell = {
  fontSize: '18px',
  color: '#1f2937',
  fontWeight: '700',
  paddingTop: '8px',
};

const totalValueCell = {
  fontSize: '18px',
  color: '#2563eb',
  fontWeight: '700',
  textAlign: 'right' as const,
  paddingTop: '8px',
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
