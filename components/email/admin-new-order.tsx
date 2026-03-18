import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import { siteConfig } from "@/config/site";

interface AdminNewOrderProps {
  orderReference: string;
  customerEmail: string;
  total: string;
  itemCount: number;
  adminUrl: string;
}

export default function AdminNewOrder({
  orderReference = "BLINDLY-XXXXXXXX-0000",
  customerEmail = "customer@example.com",
  total = "R 0.00",
  itemCount = 0,
  adminUrl = "/admin/shop/orders",
}: AdminNewOrderProps) {
  return (
    <Html>
      <Head />
      <Preview>New order — {orderReference}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>New Order Received</Heading>
          <Text style={text}>
            A new order has been placed on {siteConfig.name}.
          </Text>
          <Text style={text}>
            <strong>Reference:</strong> {orderReference}
            <br />
            <strong>Customer:</strong> {customerEmail}
            <br />
            <strong>Items:</strong> {itemCount}
            <br />
            <strong>Total:</strong> {total}
          </Text>
          <Link href={adminUrl} style={button}>
            View Order
          </Link>
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
const heading = { fontSize: "24px", fontWeight: "bold" as const };
const text = { fontSize: "14px", lineHeight: "24px", color: "#333" };
const button = {
  display: "inline-block",
  backgroundColor: "#3CB4A4",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold" as const,
  marginTop: "16px",
};
