const nodemailer = require('nodemailer');
const logger = require('./logger');

const formatProviderError = (error) => {
  if (!error) return 'Unknown provider error';

  const parts = [];

  if (error.message) {
    parts.push(error.message);
  }

  if (error.code) {
    parts.push(`code=${error.code}`);
  }

  if (error.response?.statusCode) {
    parts.push(`status=${error.response.statusCode}`);
  }

  const sgErrors = Array.isArray(error.response?.body?.errors)
    ? error.response.body.errors
    : [];

  if (sgErrors.length > 0) {
    const details = sgErrors
      .map((item) => {
        if (!item || typeof item !== 'object') return String(item);
        const msg = item.message || 'Unknown SendGrid error';
        const field = item.field ? ` field=${item.field}` : '';
        const help = item.help ? ` help=${item.help}` : '';
        return `${msg}${field}${help}`.trim();
      })
      .join(' | ');
    parts.push(`details=${details}`);
  }

  if (parts.length === 0) {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return parts.join(' ; ');
};

// Mail service with safe fallback behavior
class MailService {
  constructor() {
    this.transporter = null;
    this.configured = false;
    this.provider = 'smtp';
    this.smtpConfig = null;
    this.smtpVerified = false;
    this.initializeTransport();
  }

  getRequestedProvider() {
    return String(process.env.MAIL_PROVIDER || '').trim().toLowerCase();
  }

  hasSmtpConfig() {
    return Boolean(this.smtpConfig?.host && this.smtpConfig?.auth?.user && this.smtpConfig?.auth?.pass);
  }

  getSmtpConfig() {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
  }

  shouldUseSendGrid() {
    const requestedProvider = this.getRequestedProvider();
    if (requestedProvider === 'sendgrid') return true;
    if (requestedProvider === 'smtp') return false;
    return Boolean(process.env.SENDGRID_API_KEY);
  }

  initializeTransport() {
    try {
      const mailProvider = this.getRequestedProvider() || (process.env.SENDGRID_API_KEY ? 'sendgrid' : 'smtp');

      this.provider = mailProvider;

      if (mailProvider === 'smtp') {
        this.smtpConfig = this.getSmtpConfig();

        // Validate SMTP config
        if (!this.hasSmtpConfig()) {
          logger.warn('[MailService] SMTP config incomplete. Email delivery disabled.');
          return;
        }

        this.transporter = nodemailer.createTransport(this.smtpConfig);
        this.configured = true;
        logger.info('[MailService] SMTP configured successfully');

        // Verify SMTP connectivity early so deployment issues show up in logs.
        this.transporter
          .verify()
          .then(() => {
            this.smtpVerified = true;
            logger.info('[MailService] SMTP connection verified');
          })
          .catch((error) => {
            this.smtpVerified = false;
            logger.warn(`[MailService] SMTP verification failed: ${error.message}`);
          });
      } else if (mailProvider === 'sendgrid') {
        if (!process.env.SENDGRID_API_KEY) {
          logger.warn('[MailService] SendGrid API key missing. Falling back to SMTP if configured.');
          this.provider = 'smtp';
          this.smtpConfig = this.getSmtpConfig();
          if (!this.hasSmtpConfig()) {
            logger.warn('[MailService] SMTP fallback also incomplete. Email delivery disabled.');
            return;
          }
          this.transporter = nodemailer.createTransport(this.smtpConfig);
          this.configured = true;
          logger.info('[MailService] SMTP configured successfully (fallback)');
          return;
        }

        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.transporter = sgMail;
        this.configured = true;
        logger.info('[MailService] SendGrid configured successfully');
      } else if (mailProvider === 'test') {
        // Test/development mode - logs emails instead of sending
        this.configured = true;
        this.provider = 'test';
        logger.info('[MailService] Test mode enabled - emails will be logged');
      } else {
        logger.warn(`[MailService] Unknown MAIL_PROVIDER "${mailProvider}". Email delivery disabled.`);
      }
    } catch (error) {
      logger.warn(`[MailService] Initialization error: ${error.message}. Email delivery disabled.`);
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
        logger.warn(`[MailService] Email not configured. Skipping: ${subject} to ${to}`);
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

      const mailProvider = this.getRequestedProvider() || this.provider || 'smtp';

      if (mailProvider === 'test') {
        logger.info(`[MailService TEST] To: ${to}`);
        logger.info(`[MailService TEST] Subject: ${subject}`);
        logger.debug(`[MailService TEST] Body: ${html || text}`);
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

        try {
          await sgMail.send(message);
          return {
            success: true,
            message: 'Email sent via SendGrid',
            messageId: `sg-${Date.now()}`,
          };
        } catch (sendgridError) {
          const providerError = formatProviderError(sendgridError);
          logger.warn(`[MailService] SendGrid send failed for ${to}: ${providerError}`);

          if (this.hasSmtpConfig()) {
            logger.info('[MailService] Falling back to SMTP after SendGrid failure');
            const smtpTransport = nodemailer.createTransport(this.smtpConfig || this.getSmtpConfig());
            const result = await smtpTransport.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to,
              subject,
              html: html || text,
              text: text || undefined,
            });

            return {
              success: true,
              message: 'Email sent via SMTP fallback after SendGrid failure',
              messageId: result.messageId,
            };
          }

          throw sendgridError;
        }
      }

      // SMTP
      this.smtpConfig = this.smtpConfig || this.getSmtpConfig();
      if (!this.transporter) {
        this.transporter = nodemailer.createTransport(this.smtpConfig);
      }
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
      const providerError = formatProviderError(error);
      logger.error(`[MailService] Error sending email to ${to}: ${providerError}`);
      return {
        success: false,
        message: 'Failed to send email',
        error: providerError,
      };
    }
  }

  isConfigured() {
    return this.configured;
  }
}

module.exports = new MailService();
