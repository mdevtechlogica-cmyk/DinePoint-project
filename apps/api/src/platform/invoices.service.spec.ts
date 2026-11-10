import { BadRequestException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoicesService } from './invoices.service.js';
import { PlatformAuditService } from './platform-audit.service.js';

describe('InvoicesService', () => {
  const findInvoice = vi.fn();
  const updateInvoice = vi.fn();
  const prisma = {
    invoice: { findUnique: findInvoice, update: updateInvoice },
  } as unknown as PrismaService;
  const audit = { write: vi.fn() } as unknown as PlatformAuditService;
  let service: InvoicesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InvoicesService(prisma, audit);
  });

  it('does not mark a paid invoice as paid again', async () => {
    findInvoice.mockResolvedValue({ id: 'invoice-1', status: InvoiceStatus.PAID });

    await expect(
      service.update('invoice-1', 'admin-1', { status: InvoiceStatus.PAID }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(updateInvoice).not.toHaveBeenCalled();
  });
});
