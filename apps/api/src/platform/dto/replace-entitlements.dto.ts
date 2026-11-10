import { Type } from 'class-transformer';
import { Allow, ArrayUnique, IsArray, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class EntitlementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  key!: string;

  @Allow()
  value!: unknown;
}

export class ReplaceEntitlementsDto {
  @IsArray()
  @ArrayUnique((item: EntitlementDto) => item.key)
  @ValidateNested({ each: true })
  @Type(() => EntitlementDto)
  entitlements!: EntitlementDto[];
}
