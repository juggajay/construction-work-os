/**
 * Base Email Template
 *
 * Provides a consistent HTML structure for all RFI emails
 */

export interface BaseTemplateProps {
  title: string
  preheader?: string
  content: string
  ctaUrl?: string
  ctaText?: string
}

export function baseEmailTemplate({
  title,
  preheader,
  content,
  ctaUrl,
  ctaText = 'View Details',
}: BaseTemplateProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a1a1a;
      font-size: 24px;
      margin-bottom: 24px;
    }
    .content {
      margin-bottom: 32px;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 16px;
    }
    .cta-button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #666;
    }
    .preheader {
      display: none;
      font-size: 1px;
      color: #ffffff;
      line-height: 1px;
      max-height: 0px;
      max-width: 0px;
      opacity: 0;
      overflow: hidden;
    }
    .meta-info {
      background-color: #f9fafb;
      border-left: 4px solid #2563eb;
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    .meta-info strong {
      color: #1a1a1a;
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="email-container">
    <h1>${title}</h1>
    <div class="content">
      ${content}
    </div>
    ${
      ctaUrl
        ? `<a href="${ctaUrl}" class="cta-button">${ctaText}</a>`
        : ''
    }
    <div class="footer">
      <p>Construction Work OS - Project Management Platform</p>
      <p style="font-size: 12px; color: #999;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
