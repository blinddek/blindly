import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { siteConfig } from "@/config/site";

interface OrderConfirmationProps {
  customerName: string;
  orderReference: string;
  items: { name: string; quantity: number; price_cents: number }[];
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
}

export default function OrderConfirmation({
  customerName = "Customer",
  orderReference = "BLINDLY-XXXXXXXX-0000",
  items = [],
  subtotal = "R 0.00",
  shipping = "R 0.00",
  tax = "R 0.00",
  total = "R 0.00",
}: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Order confirmed — {orderReference}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{siteConfig.name}</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Thank you for your order! We&apos;ve received your payment and your
            order is being processed.
          </Text>

          <Section style={orderBox}>
            <Text style={label}>Order Reference</Text>
            <Text style={value}>{orderReference}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={sectionTitle}>Items</Text>
          {items.map((item, i) => (
            <Text key={i} style={lineItem}>
              {item.name} x {item.quantity}
            </Text>
          ))}

          <Hr style={hr} />

          <table style={{ width: "100%", fontSize: "14px" }}>
            <tbody>
              <tr>
                <td style={summaryLabel}>Subtotal</td>
                <td style={summaryValue}>{subtotal}</td>
              </tr>
              <tr>
                <td style={summaryLabel}>Shipping</td>
                <td style={summaryValue}>{shipping}</td>
              </tr>
              <tr>
                <td style={summaryLabel}>Tax</td>
                <td style={summaryValue}>{tax}</td>
              </tr>
              <tr>
                <td style={{ ...summaryLabel, fontWeight: "bold" }}>Total</td>
                <td style={{ ...summaryValue, fontWeight: "bold" }}>
                  {total}
                </td>
              </tr>
            </tbody>
          </table>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions, simply reply to this email. Thank you for
            shopping with {siteConfig.name}!
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "580px",
};
const heading = { fontSize: "24px", fontWeight: "bold" as const, textAlign: "center" as const };
const text = { fontSize: "14px", lineHeight: "24px", color: "#333" };
const orderBox = { backgroundColor: "#f4f4f5", padding: "16px", borderRadius: "8px", marginTop: "16px" };
const label = { fontSize: "12px", color: "#666", margin: "0" };
const value = { fontSize: "16px", fontWeight: "bold" as const, margin: "4px 0 0" };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const sectionTitle = { fontSize: "16px", fontWeight: "bold" as const };
const lineItem = { fontSize: "14px", margin: "4px 0", color: "#333" };
const summaryLabel = { padding: "4px 0", color: "#666" };
const summaryValue = { padding: "4px 0", textAlign: "right" as const };
const footer = { fontSize: "12px", color: "#999", marginTop: "24px" };
