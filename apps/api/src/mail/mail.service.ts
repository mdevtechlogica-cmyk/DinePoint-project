import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get<string>('SMTP_PORT', '587')),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: { user, pass },
      });
    }
  }

  get isConfigured() {
    return this.transporter != null;
  }

  async sendPasswordReset(email: string, rawToken: string) {
    const appUrl = this.config.get<string>(
      'PASSWORD_RESET_APP_URL',
      'dinepoint://reset-password',
    );
    const link = `${appUrl}?token=${encodeURIComponent(rawToken)}`;
    const subject = 'Reset your DinePoint password';
    const text =
      `Use this link to reset your Host Stand password (valid 1 hour):\n\n` +
      `${link}\n\n` +
      `If you did not request this, you can ignore this email.`;

    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured. Password reset for ${email}: ${rawToken}`,
      );
      return { delivered: false as const, link };
    }

    const from =
      this.config.get<string>('SMTP_FROM') ??
      this.config.get<string>('SMTP_USER') ??
      'noreply@dinepoint.app';

    await this.transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      html: `<p>Use this link to reset your Host Stand password (valid 1 hour):</p><p><a href="${link}">${link}</a></p>`,
    });

    return { delivered: true as const, link };
  }
}
