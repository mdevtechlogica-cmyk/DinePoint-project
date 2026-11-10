
import {
    ArrayMinSize,
    ArrayMaxSize,
    ArrayUnique,
    IsArray,
    IsIn,
    IsOptional,
    IsString,
    IsDateString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export const API_KEY_SCOPES = [
    'restaurants:read',
    'tables:read',
    'reservations:read',
    'reservations:write',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export class CreateApiKeyDto {
    @IsString()
    @MinLength(2)
    @MaxLength(80)
    @Matches(/\S/, {
        message: 'Name must contain at least one non-whitespace character',
    })
    name!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(API_KEY_SCOPES.length)
    @ArrayUnique()
    @IsIn(API_KEY_SCOPES, { each: true })
    scopes!: ApiKeyScope[];

    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}
