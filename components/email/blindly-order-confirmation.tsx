import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,

  Section,
  Text,
} from "@react-email/components";
import { siteConfig } from "@/config/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || `https://${siteConfig.domain}`;

interface BlindItem {
  range_name: string;
  colour: string;
  mount_type: string;
  width_mm: number;
  drop_mm: number;
  matched_width_cm: number;
  matched_drop_cm: number;
  control_side: string;
  location_label?: string | null;
  selected_extras?: { name: string; price_cents: number }[];
  line_total_cents: number;
}

interface Props {
  customerName: string;
  orderNumber: string;
  items: BlindItem[];
  subtotalCents: number;
  vatCents: number;
  discountCents: number;
  installationFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  deliveryType: string;
}

function fmt(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BlindlyOrderConfirmation({
  customerName = "Customer",
  orderNumber = "BL-2026-0001",
  items = [],
  subtotalCents = 0,
  vatCents = 0,
  discountCents = 0,
  installationFeeCents = 0,
  deliveryFeeCents = 0,
  totalCents = 0,
  deliveryType = "self_install",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Order confirmed — {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${SITE_URL}/logo.png`}
            alt={siteConfig.name}
            width={140}
            style={{ display: "block", margin: "0 auto 8px" }}
          />
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Thank you for your order! Your payment has been received and your
            blinds are being prepared for production. We&apos;ll be in touch
            with an update once your order has been dispatched.
          </Text>

          <Section style={orderBox}>
            <Text style={label}>Order Reference</Text>
            <Text style={value}>{orderNumber}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={sectionTitle}>Your Blinds ({items.length})</Text>
          {items.map((item, i) => (
            <Section key={i} style={itemBox}>
              <Text style={itemTitle}>
                Blind {i + 1}{item.location_label ? ` — ${item.location_label}` : ""}
              </Text>
              <table style={{ width: "100%", fontSize: "13px", color: "#555" }}>
                <tbody>
                  <tr>
                    <td style={specLabel}>Range</td>
                    <td style={specValue}>{item.range_name}</td>
                  </tr>
                  <tr>
                    <td style={specLabel}>Colour</td>
                    <td style={specValue}>{item.colour}</td>
                  </tr>
                  <tr>
                    <td style={specLabel}>Mount</td>
                    <td style={specValue} className="capitalize">{item.mount_type}</td>
                  </tr>
                  <tr>
                    <td style={specLabel}>Your size</td>
                    <td style={specValue}>{item.width_mm}mm × {item.drop_mm}mm</td>
                  </tr>
                  <tr>
                    <td style={specLabel}>Made to</td>
                    <td style={specValue}>{item.matched_width_cm * 10}mm × {item.matched_drop_cm * 10}mm</td>
                  </tr>
                  <tr>
                    <td style={specLabel}>Control side</td>
                    <td style={specValue} className="capitalize">{item.control_side}</td>
                  </tr>
                </tbody>
              </table>
              {item.selected_extras && item.selected_extras.length > 0 && (
                <>
                  <Text style={{ ...specLabel, marginTop: "8px" }}>Accessories</Text>
                  {item.selected_extras.map((e, j) => (
                    <Text key={j} style={{ fontSize: "12px", margin: "2px 0", color: "#555" }}>
                      • {e.name} — {fmt(e.price_cents)}
                    </Text>
                  ))}
                </>
              )}
              <Text style={{ fontSize: "13px", fontWeight: "bold", marginTop: "8px", color: "#333" }}>
                Line total (incl. VAT): {fmt(item.line_total_cents)}
              </Text>
            </Section>
          ))}

          <Hr style={hr} />

          <table style={{ width: "100%", fontSize: "14px" }}>
            <tbody>
              <tr>
                <td style={summaryLabel}>Subtotal (ex-VAT)</td>
                <td style={summaryValue}>{fmt(subtotalCents)}</td>
              </tr>
              <tr>
                <td style={summaryLabel}>VAT (15%)</td>
                <td style={summaryValue}>{fmt(vatCents)}</td>
              </tr>
              {discountCents > 0 && (
                <tr>
                  <td style={{ ...summaryLabel, color: "#16a34a" }}>Volume discount</td>
                  <td style={{ ...summaryValue, color: "#16a34a" }}>−{fmt(discountCents)}</td>
                </tr>
              )}
              {installationFeeCents > 0 && (
                <tr>
                  <td style={summaryLabel}>Installation fee</td>
                  <td style={summaryValue}>{fmt(installationFeeCents)}</td>
                </tr>
              )}
              {deliveryFeeCents > 0 && (
                <tr>
                  <td style={summaryLabel}>Transport fee</td>
                  <td style={summaryValue}>{fmt(deliveryFeeCents)}</td>
                </tr>
              )}
              <tr>
                <td style={{ ...summaryLabel, fontWeight: "bold", fontSize: "15px" }}>Total paid</td>
                <td style={{ ...summaryValue, fontWeight: "bold", fontSize: "15px" }}>{fmt(totalCents)}</td>
              </tr>
            </tbody>
          </table>

          <Hr style={hr} />

          <Text style={text}>
            {deliveryType === "professional_install"
              ? "Our team will contact you to arrange a convenient installation date."
              : "Your blinds will be shipped to your delivery address. Installation instructions are included."}
          </Text>

          <Text style={footer}>
            Questions? Email us at info@nortier.co.za and we&apos;ll be happy to help.
            — The {siteConfig.name} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" };
const container = { backgroundColor: "#fff", margin: "0 auto", padding: "40px 20px", maxWidth: "600px" };
const text = { fontSize: "14px", lineHeight: "24px", color: "#333" };
const orderBox = { backgroundColor: "#f4f4f5", padding: "16px", borderRadius: "8px", marginTop: "16px" };
const label = { fontSize: "12px", color: "#666", margin: "0" };
const value = { fontSize: "16px", fontWeight: "bold" as const, margin: "4px 0 0" };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const sectionTitle = { fontSize: "16px", fontWeight: "bold" as const };
const itemBox = { backgroundColor: "#f9fafb", padding: "12px 16px", borderRadius: "8px", marginBottom: "12px", border: "1px solid #e5e7eb" };
const itemTitle = { fontSize: "14px", fontWeight: "bold" as const, margin: "0 0 8px", color: "#111" };
const specLabel = { color: "#999", fontSize: "12px", width: "120px", paddingBottom: "2px" };
const specValue = { color: "#333", fontSize: "12px", paddingBottom: "2px" };
const summaryLabel = { padding: "4px 0", color: "#666" };
const summaryValue = { padding: "4px 0", textAlign: "right" as const };
const footer = { fontSize: "12px", color: "#999", marginTop: "24px" };
