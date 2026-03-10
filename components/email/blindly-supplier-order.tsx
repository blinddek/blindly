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
}

interface Props {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
  };
  deliveryType: string;
  items: BlindItem[];
  adminUrl: string;
}

export default function BlindlySupplierOrder({
  orderNumber = "BL-2026-0001",
  customerName = "Customer",
  customerEmail = "",
  customerPhone = "",
  deliveryAddress = { street: "", city: "", province: "", postal_code: "" },
  deliveryType = "self_install",
  items = [],
  adminUrl = "",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New blind order — {orderNumber} ({items.length} blind{items.length !== 1 ? "s" : ""})</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{siteConfig.name} — Supplier Order</Heading>

          <Section style={alertBox}>
            <Text style={{ fontSize: "18px", fontWeight: "bold", margin: "0", color: "#fff" }}>
              NEW ORDER: {orderNumber}
            </Text>
            <Text style={{ fontSize: "14px", margin: "4px 0 0", color: "#fef3c7" }}>
              {items.length} blind{items.length !== 1 ? "s" : ""} to manufacture
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Customer & delivery */}
          <Text style={sectionTitle}>Customer Details</Text>
          <table style={{ width: "100%", fontSize: "13px" }}>
            <tbody>
              <tr>
                <td style={specLabel}>Name</td>
                <td style={specValue}>{customerName}</td>
              </tr>
              <tr>
                <td style={specLabel}>Email</td>
                <td style={specValue}>{customerEmail}</td>
              </tr>
              <tr>
                <td style={specLabel}>Phone</td>
                <td style={specValue}>{customerPhone}</td>
              </tr>
              <tr>
                <td style={specLabel}>Delivery</td>
                <td style={specValue}>
                  {deliveryAddress.street}, {deliveryAddress.city},{" "}
                  {deliveryAddress.province} {deliveryAddress.postal_code}
                </td>
              </tr>
              <tr>
                <td style={specLabel}>Install type</td>
                <td style={specValue}>
                  {deliveryType === "professional_install" ? "Professional installation" : "Self install"}
                </td>
              </tr>
            </tbody>
          </table>

          <Hr style={hr} />

          {/* Blind specs */}
          <Text style={sectionTitle}>
            Blind Specifications ({items.length} item{items.length !== 1 ? "s" : ""})
          </Text>

          {items.map((item, i) => (
            <Section key={i} style={itemBox}>
              <Text style={itemTitle}>
                BLIND {i + 1}{item.location_label ? ` — ${item.location_label.toUpperCase()}` : ""}
              </Text>
              <table style={{ width: "100%", fontSize: "13px" }}>
                <tbody>
                  <tr>
                    <td style={specLabel}>Range</td>
                    <td style={{ ...specValue, fontWeight: "bold" }}>{item.range_name}</td>
                  </tr>
                  <tr>
                    <td style={specLabel}>Colour</td>
                    <td style={{ ...specValue, fontWeight: "bold" }}>{item.colour}</td>
                  </tr>
                  <tr>
                    <td style={specLabel}>Mount type</td>
                    <td style={specValue}>{item.mount_type === "inside" ? "Inside mount" : "Outside mount"}</td>
                  </tr>
                  <tr>
                    <td style={specLabel}>Client size</td>
                    <td style={specValue}>{item.width_mm}mm × {item.drop_mm}mm</td>
                  </tr>
                  <tr>
                    <td style={specLabel}>
                      <strong>MANUFACTURE TO</strong>
                    </td>
                    <td style={{ ...specValue, fontWeight: "bold", fontSize: "14px", color: "#111" }}>
                      {item.matched_width_cm * 10}mm wide × {item.matched_drop_cm * 10}mm drop
                    </td>
                  </tr>
                  <tr>
                    <td style={specLabel}>Control side</td>
                    <td style={specValue}>{item.control_side === "left" ? "Left" : "Right"}</td>
                  </tr>
                </tbody>
              </table>
              {item.selected_extras && item.selected_extras.length > 0 && (
                <>
                  <Text style={{ fontSize: "12px", fontWeight: "bold", margin: "10px 0 4px", color: "#555" }}>
                    Accessories to include:
                  </Text>
                  {item.selected_extras.map((e, j) => (
                    <Text key={j} style={{ fontSize: "12px", margin: "2px 0", color: "#333" }}>
                      ✓ {e.name}
                    </Text>
                  ))}
                </>
              )}
            </Section>
          ))}

          <Hr style={hr} />

          <Text style={text}>
            Please process this order as soon as possible. View full order details in the admin panel:
          </Text>
          <Text style={{ fontSize: "13px", color: "#C4663A" }}>{adminUrl}</Text>

          <Hr style={hr} />
          <Text style={footer}>
            This is an automated order notification from {siteConfig.name}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" };
const container = { backgroundColor: "#fff", margin: "0 auto", padding: "40px 20px", maxWidth: "600px" };
const heading = { fontSize: "22px", fontWeight: "bold" as const, textAlign: "center" as const };
const alertBox = { backgroundColor: "#C4663A", padding: "20px", borderRadius: "8px", textAlign: "center" as const };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const sectionTitle = { fontSize: "15px", fontWeight: "bold" as const, color: "#111", marginBottom: "8px" };
const itemBox = { backgroundColor: "#f9fafb", padding: "14px 16px", borderRadius: "8px", marginBottom: "14px", border: "2px solid #e5e7eb" };
const itemTitle = { fontSize: "13px", fontWeight: "bold" as const, margin: "0 0 10px", color: "#C4663A", letterSpacing: "0.05em" };
const specLabel = { color: "#999", fontSize: "12px", width: "130px", paddingBottom: "4px", verticalAlign: "top" as const };
const specValue = { color: "#333", fontSize: "12px", paddingBottom: "4px" };
const text = { fontSize: "14px", lineHeight: "22px", color: "#333" };
const footer = { fontSize: "12px", color: "#999", marginTop: "16px" };
