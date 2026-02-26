/**
 * HTML email base template wrapper.
 *
 * Wraps campaign/drip body HTML in a branded shell with header,
 * footer, and unsubscribe link. Uses siteConfig for branding.
 */

import { siteConfig } from "@/config/site";

export function baseTemplate(
  _subject: string,
  bodyHtml: string,
  baseUrl: string,
  unsubscribeUrl?: string
): string {
  const primary = siteConfig.brand.primary;
  const name = siteConfig.name;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:${primary};padding:24px 32px;text-align:center;">
              <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${name}</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;font-size:15px;line-height:1.6;color:#374151;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
              <p style="margin:0 0 8px;">&copy; ${year} ${name}. All rights reserved.</p>
              ${
                unsubscribeUrl
                  ? `<p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a></p>`
                  : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
