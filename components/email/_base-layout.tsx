// components/email/_base-layout.tsx
// Base layout for all email templates

import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Font,
} from "@react-email/components";
import * as React from "react";

// ─── Brand Tokens ─────────────────────────────────────────
export const brand = {
  bgDark: "#111111",
  bgCard: "#1a1a1a",
  bgCardHover: "#222222",
  teal: "#2ba3a3",
  tealLight: "#3dc4c4",
  magenta: "#9b2d5e",
  orange: "#f5a623",
  red: "#e85535",
  green: "#7cb342",
  textPrimary: "#f0f0f0",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  border: "#2a2a2a",

  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  portalUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal`,
  unsubscribeBaseUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email/unsubscribe`,
} as const;

// ─── Shared Styles ────────────────────────────────────────
export const styles = {
  body: {
    backgroundColor: brand.bgDark,
    fontFamily: brand.fontFamily,
    margin: "0",
    padding: "0",
  },
  container: {
    backgroundColor: brand.bgCard,
    borderRadius: "8px",
    margin: "40px auto",
    maxWidth: "600px",
    padding: "0",
    border: `1px solid ${brand.border}`,
  },
  header: {
    backgroundColor: brand.bgDark,
    borderRadius: "8px 8px 0 0",
    padding: "24px 32px",
    textAlign: "center" as const,
  },
  logo: {
    height: "32px",
    width: "auto",
  },
  content: {
    padding: "32px",
  },
  h1: {
    color: brand.textPrimary,
    fontSize: "24px",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0 0 16px",
  },
  h2: {
    color: brand.textPrimary,
    fontSize: "18px",
    fontWeight: "600",
    lineHeight: "1.4",
    margin: "24px 0 8px",
  },
  paragraph: {
    color: brand.textSecondary,
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 16px",
  },
  ctaButton: {
    backgroundColor: brand.teal,
    borderRadius: "6px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "600",
    padding: "12px 28px",
    textAlign: "center" as const,
    textDecoration: "none",
  },
  ctaContainer: {
    textAlign: "center" as const,
    margin: "24px 0",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    border: `1px solid ${brand.teal}`,
    borderRadius: "6px",
    color: brand.teal,
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "500",
    padding: "10px 24px",
    textAlign: "center" as const,
    textDecoration: "none",
  },
  infoBox: {
    backgroundColor: brand.bgDark,
    borderRadius: "6px",
    border: `1px solid ${brand.border}`,
    padding: "16px 20px",
    margin: "16px 0",
  },
  infoLabel: {
    color: brand.textMuted,
    fontSize: "12px",
    fontWeight: "500",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 4px",
  },
  infoValue: {
    color: brand.textPrimary,
    fontSize: "16px",
    fontWeight: "600",
    margin: "0",
  },
  hr: {
    borderColor: brand.border,
    margin: "24px 0",
  },
  footer: {
    padding: "24px 32px",
    textAlign: "center" as const,
  },
  footerText: {
    color: brand.textMuted,
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 8px",
  },
  footerLink: {
    color: brand.textMuted,
    textDecoration: "underline",
  },
  link: {
    color: brand.teal,
    textDecoration: "underline",
  },
  badge: {
    borderRadius: "4px",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  listItem: {
    color: brand.textSecondary,
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 6px",
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Base Layout Component ────────────────────────────────
interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
  unsubscribeToken?: string;
  showPortalLink?: boolean;
}

export function BaseLayout({
  preview,
  children,
  unsubscribeToken,
  showPortalLink = true,
}: BaseLayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Link href={brand.siteUrl}>
              <Text style={{ color: brand.textPrimary, fontSize: "20px", fontWeight: "700", margin: "0" }}>
                {process.env.NEXT_PUBLIC_SITE_NAME || "Your Company"}
              </Text>
            </Link>
          </Section>

          {/* Content */}
          <Section style={styles.content}>{children}</Section>

          {/* Footer */}
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            {showPortalLink && (
              <Text style={styles.footerText}>
                <Link href={brand.portalUrl} style={styles.footerLink}>
                  Open your portal
                </Link>
                {" · "}
                <Link href={brand.siteUrl} style={styles.footerLink}>
                  Visit website
                </Link>
              </Text>
            )}
            <Text style={styles.footerText}>
              {process.env.NEXT_PUBLIC_SITE_NAME || "Your Company"}
            </Text>
            {unsubscribeToken && (
              <Text style={styles.footerText}>
                <Link
                  href={`${brand.unsubscribeBaseUrl}?token=${unsubscribeToken}`}
                  style={styles.footerLink}
                >
                  Unsubscribe from marketing emails
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Reusable Blocks ──────────────────────────────────────

/** Primary CTA button centered */
export function CtaButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={styles.ctaContainer}>
      <Link href={href} style={styles.ctaButton}>
        {children}
      </Link>
    </Section>
  );
}

/** Secondary outline button */
export function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={styles.ctaContainer}>
      <Link href={href} style={styles.secondaryButton}>
        {children}
      </Link>
    </Section>
  );
}

/** Info box with label + value (e.g. "Total: R 12,500") */
export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Section style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </Section>
  );
}
