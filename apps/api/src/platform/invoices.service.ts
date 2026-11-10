import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto.js';
import { pageWindow } from './dto/pagination-query.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
import { PlatformAuditService } from './platform-audit.service.js';

const invoiceInclude = {
  organization: { select: { id: true, name: true, slug: true } },
  subscription: { select: { id: true, status: true, planId: true } },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PlatformAuditService,
  ) {}

  async list(query: ListInvoicesQueryDto) {
    const { page, pageSize, skip } = pageWindow(query.page, query.pageSize);
    const where: Prisma.InvoiceWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
    };

    const [totalCount, rows] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        include: invoiceInclude,
        orderBy: { issuedAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return { page, pageSize, totalCount, rows };
  }

  async create(actorUserId: string, dto: CreateInvoiceDto) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException('Client not found.');
    }

    if (dto.subscriptionId) {
      const subscription = await this.prisma.subscription.findFirst({
        where: { id: dto.subscriptionId, organizationId: dto.organizationId },
        select: { id: true },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found for this client.');
      }
    }

    const periodStart = dto.periodStart ? new Date(dto.periodStart) : null;
    const periodEnd = dto.periodEnd ? new Date(dto.periodEnd) : null;

    if (periodStart && periodEnd && periodEnd <= periodStart) {
      throw new BadRequestException('The invoice period end must be after the start.');
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          organizationId: dto.organizationId,
          subscriptionId: dto.subscriptionId,
          amount: dto.amount,
          currency: dto.currency?.toUpperCase() ?? 'INR',
          periodStart,
          periodEnd,
          paymentReference: dto.paymentReference?.trim(),
          createdByUserId: actorUserId,
        },
        include: invoiceInclude,
      });

      await this.audit.write(tx, {
        actorUserId,
        action: 'INVOICE_CREATED',
        targetType: 'Invoice',
        targetId: invoice.id,
        description: `Created an invoice for ${organization.name}.`,
      });

      return invoice;
    });
  }

  async update(invoiceId: string, actorUserId: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, status: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }

    if (invoice.status !== InvoiceStatus.DUE) {
      throw new BadRequestException('Only a due invoice can be marked paid or void.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: dto.status,
          paymentReference: dto.paymentReference?.trim(),
          paidAt: dto.status === InvoiceStatus.PAID ? new Date() : null,
        },
        include: invoiceInclude,
      });

      await this.audit.write(tx, {
        actorUserId,
        action: dto.status === InvoiceStatus.PAID ? 'INVOICE_PAID' : 'INVOICE_VOIDED',
        targetType: 'Invoice',
        targetId: invoiceId,
        description: `Invoice marked ${dto.status.toLowerCase()}.`,
      });

      return updated;
    });
  }
}
