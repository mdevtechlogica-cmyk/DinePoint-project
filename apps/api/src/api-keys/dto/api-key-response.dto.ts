
export interface ApiKeyResponseDto {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    expiresAt: Date | null;
    revokedAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
  }
  