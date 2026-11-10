import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageChannel } from '@prisma/client';

export type ProviderSendResult =
  | { ok: true; provider: 'TWILIO'; sid: string }
  | { ok: false; provider: 'NONE' | 'TWILIO'; error?: string };

@Injectable()
export class MessageProviderService {
  private readonly logger = new Logger(MessageProviderService.name);

  constructor(private readonly config: ConfigService) {}

  get isConfigured() {
    return Boolean(
      this.config.get<string>('TWILIO_ACCOUNT_SID') &&
        this.config.get<string>('TWILIO_AUTH_TOKEN') &&
        this.config.get<string>('TWILIO_FROM_NUMBER'),
    );
  }

  async send(input: {
    channel: MessageChannel;
    toPhone: string;
    body: string;
  }): Promise<ProviderSendResult> {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_FROM_NUMBER');
    const whatsappFrom = this.config.get<string>('TWILIO_WHATSAPP_FROM');

    if (!sid || !token || !from) {
      return { ok: false, provider: 'NONE' };
    }

    const to =
      input.channel === MessageChannel.WHATSAPP
        ? `whatsapp:${this.normalizeE164(input.toPhone)}`
        : this.normalizeE164(input.toPhone);
    const fromAddr =
      input.channel === MessageChannel.WHATSAPP
        ? whatsappFrom || `whatsapp:${from}`
        : from;

    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const body = new URLSearchParams({
      To: to,
      From: fromAddr,
      Body: input.body,
    });

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        },
      );
      const json = (await response.json()) as { sid?: string; message?: string };
      if (!response.ok) {
        this.logger.warn(`Twilio send failed: ${json.message ?? response.status}`);
        return {
          ok: false,
          provider: 'TWILIO',
          error: json.message ?? `HTTP ${response.status}`,
        };
      }
      return { ok: true, provider: 'TWILIO', sid: json.sid ?? 'unknown' };
    } catch (error) {
      this.logger.warn(`Twilio send error: ${String(error)}`);
      return { ok: false, provider: 'TWILIO', error: String(error) };
    }
  }

  private normalizeE164(phone: string) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return phone.startsWith('+') ? phone : `+${digits}`;
  }
}
