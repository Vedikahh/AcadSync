const nodemailer = require('nodemailer');

// Mail service with safe fallback behavior
class MailService {
  constructor() {
    this.transporter = null;
    this.configured = false;
    this.smtpVerified = false;
    this.initializeTransport();
  }

  initializeTransport() {
    try {
      const mailProvider = process.env.MAIL_PROVIDER || 'smtp';

      if (mailProvider === 'smtp') {
        const smtpConfig = {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        };

        // Validate SMTP config
        if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
          console.warn('[MailService] SMTP config incomplete. Email delivery disabled.');
          return;
        }

        this.transporter = nodemailer.createTransport(smtpConfig);
        this.configured = true;
        console.log('[MailService] SMTP configured successfully');

        // Verify SMTP connectivity early so deployment issues show up in logs.
        this.transporter
          .verify()
          .then(() => {
            this.smtpVerified = true;
            console.log('[MailService] SMTP connection verified');
          })
          .catch((error) => {
            this.smtpVerified = false;
            console.warn(`[MailService] SMTP verification failed: ${error.message}`);
          });
      } else if (mailProvider === 'sendgrid') {
        if (!process.env.SENDGRID_API_KEY) {
          console.warn('[MailService] SendGrid API key missing. Email delivery disabled.');
          return;
        }

        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.transporter = sgMail;
        this.configured = true;
        console.log('[MailService] SendGrid configured successfully');
      } else if (mailProvider === 'test') {
        // Test/development mode - logs emails instead of sending
        this.configured = true;
        console.log('[MailService] Test mode enabled - emails will be logged');
      }
    } catch (error) {
      console.warn(`[MailService] Initialization error: ${error.message}. Email delivery disabled.`);
    }
  }

  /**
   * Send email with safe fallback
   * @param {Object} options - { to, subject, html, text }
   * @returns {Promise<{success: boolean, message: string, messageId?: string, error?: string}>}
   */
  async sendMail({ to, subject, html, text }) {
    try {
      if (!this.configured) {
        console.warn(`[MailService] Email not configured. Skipping: ${subject} to ${to}`);
        return {
          success: false,
          message: 'Email service not configured',
          error: 'Email provider not properly configured',
        };
      }

      if (!to || !subject) {
        return {
          success: false,
          message: 'Missing required fields: to, subject',
          error: 'Invalid mail parameters',
        };
      }

      const mailProvider = process.env.MAIL_PROVIDER || 'smtp';

      if (mailProvider === 'test') {
        console.log(`[MailService TEST] To: ${to}`);
        console.log(`[MailService TEST] Subject: ${subject}`);
        console.log(`[MailService TEST] Body:\n${html || text}`);
        return {
          success: true,
          message: 'Email logged (test mode)',
          messageId: `test-${Date.now()}`,
        };
      }

      if (mailProvider === 'sendgrid') {
        const sgMail = require('@sendgrid/mail');
        const message = {
          to,
          from: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER,
          subject,
          html: html || text,
          text: text || undefined,
        };

        await sgMail.send(message);
        return {
          success: true,
          message: 'Email sent via SendGrid',
          messageId: `sg-${Date.now()}`,
        };
      }

      // SMTP
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html: html || text,
        text: text || undefined,
      };

      const result = await this.transporter.sendMail(mailOptions);
      if (!this.smtpVerified) {
        this.smtpVerified = true;
      }
      return {
        success: true,
        message: 'Email sent via SMTP',
        messageId: result.messageId,
      };
    } catch (error) {
      console.error(`[MailService] Error sending email to ${to}:`, error.message);
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message,
      };
    }
  }

  isConfigured() {
    return this.configured;
  }
}

module.exports = new MailService();
