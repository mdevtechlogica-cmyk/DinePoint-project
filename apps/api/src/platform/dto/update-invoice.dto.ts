import { InvoiceStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInvoiceDto {
  @IsEnum(InvoiceStatus)
  @IsIn([InvoiceStatus.PAID, InvoiceStatus.VOID])
  status!: typeof InvoiceStatus.PAID | typeof InvoiceStatus.VOID;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentReference?: string;
}
