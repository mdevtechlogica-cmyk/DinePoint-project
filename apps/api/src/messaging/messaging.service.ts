import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageChannel } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { EntitlementsService } from '../entitlements/entitlements.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { MessageProviderService } from './message-provider.service.js';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly provider: MessageProviderService,
  ) {}

  async send(
    organizationId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, isActive: true },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found.');

    const resolved = await this.entitlements.resolve(organizationId);
    const limit =
      dto.channel === MessageChannel.SMS
        ? resolved.limits.smsPerMonth
        : resolved.limits.whatsappPerMonth;

    const used = await this.countThisMonth(organizationId, dto.channel);
    if (limit >= 0 && used >= limit) {
      throw new ForbiddenException(
        `This plan allows ${limit} ${dto.channel === MessageChannel.SMS ? 'SMS' : 'WhatsApp'} message(s) per month. Upgrade to send more.`,
      );
    }

    const phone = dto.phone.replace(/\s+/g, '');
    const body = dto.body.trim();
    const providerResult = await this.provider.send({
      channel: dto.channel,
      toPhone: phone,
      body,
    });

    const status = providerResult.ok
      ? 'SENT'
      : providerResult.provider === 'NONE'
        ? 'DISPATCHED'
        : 'FAILED';

    const created = await this.prisma.outboundMessage.create({
      data: {
        organizationId,
        restaurantId: dto.restaurantId,
        reservationId: dto.reservationId,
        createdByUserId: userId,
        channel: dto.channel,
        toPhone: phone,
        body,
        status,
      },
      select: {
        id: true,
        channel: true,
        toPhone: true,
        body: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      ...created,
      usedThisMonth: used + 1,
      limit,
      remaining: limit < 0 ? null : Math.max(0, limit - used - 1),
      // PROVIDER = Twilio (or similar) already delivered.
      // DEVICE = Host Stand should open the native SMS/WhatsApp app.
      dispatch: providerResult.ok ? 'PROVIDER' : 'DEVICE',
      provider: providerResult.provider,
      providerError:
        providerResult.ok || providerResult.provider === 'NONE'
          ? undefined
          : providerResult.error,
    };
  }

  async countThisMonth(organizationId: string, channel: MessageChannel) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    return this.prisma.outboundMessage.count({
      where: {
        organizationId,
        channel,
        createdAt: { gte: start },
        status: { not: 'FAILED' },
      },
    });
  }

  async usageForOrganization(organizationId: string) {
    const [smsThisMonth, whatsappThisMonth] = await Promise.all([
      this.countThisMonth(organizationId, MessageChannel.SMS),
      this.countThisMonth(organizationId, MessageChannel.WHATSAPP),
    ]);
    return { smsThisMonth, whatsappThisMonth };
  }
}
