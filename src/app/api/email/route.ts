import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  if (!process.env.EMAIL_ADDRESS_RECEIVER) {
    return new Response("Email address receiver is not configured.", {
      status: 500,
    });
  }
  if (!process.env.EMAIL_ADDRESS_SENDER) {
    return new Response("Email address sender is not configured.", {
      status: 500,
    });
  }
  if (!process.env.SMTP_HOST) {
    return new Response("SMTP host is not configured.", { status: 500 });
  }
  if (!process.env.SMTP_PORT) {
    return new Response("SMTP port is not configured.", { status: 500 });
  }
  if (!process.env.GMAIL_APP_PASSWORD) {
    return new Response("SMTP pass is not configured.", { status: 500 });
  }

  try {
    const { contactBackEmail, subject, message } = await req.json();

    // Validation
    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              border-bottom: 3px solid #4F46E5;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #4F46E5;
              font-size: 24px;
            }
            .contact-email {
              background: #F3F4F6;
              border-left: 4px solid #10B981;
              padding: 15px 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .contact-email strong {
              color: #10B981;
              font-size: 16px;
            }
            .contact-email a {
              color: #059669;
              text-decoration: none;
              font-weight: 600;
            }
            .message-content {
              background: #F9FAFB;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              font-size: 12px;
              color: #6B7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 Nova Mensagem do Portfólio</h1>
            </div>
            
            ${
              contactBackEmail
                ? `
            <div class="contact-email">
              <strong>📧 Email para Resposta:</strong><br>
              <a href="mailto:${contactBackEmail}">${contactBackEmail}</a>
            </div>
            `
                : ""
            }
            
            <div class="message-content">
              <strong>Mensagem:</strong><br><br>
              ${message}
            </div>
            
            <div class="footer">
              Enviado através do formulário de contato do seu portfólio
            </div>
          </div>
        </body>
      </html>
    `;

    const port = Number(process.env.SMTP_PORT);
    if (!Number.isFinite(port)) {
      return new Response("SMTP port must be a number.", { status: 500 });
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_ADDRESS_SENDER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_ADDRESS_SENDER,
      to: process.env.EMAIL_ADDRESS_RECEIVER,
      subject: subject,
      html: emailHtml,
      replyTo: contactBackEmail || undefined,
    });

    return NextResponse.json({ success: true, data: info }, { status: 200 });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
