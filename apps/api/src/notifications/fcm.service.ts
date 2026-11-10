import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import {
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getMessaging, type BatchResponse } from 'firebase-admin/messaging';

import { DeviceTokensService } from '../device-tokens/device-tokens.service.js';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private ready = false;

  constructor(
    private readonly config: ConfigService,
    private readonly deviceTokens: DeviceTokensService,
  ) {}

  onModuleInit() {
    this.initialize();
  }

  get isReady() {
    return this.ready;
  }

  private initialize() {
    if (getApps().length > 0) {
      this.ready = true;
      return;
    }

    try {
      const json = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
      const credentialsPath = this.config.get<string>(
        'GOOGLE_APPLICATION_CREDENTIALS',
      );

      if (json?.trim()) {
        const parsed = JSON.parse(json) as ServiceAccount;
        initializeApp({
          credential: cert(parsed),
        });
        this.ready = true;
        this.logger.log(
          'Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON',
        );
        return;
      }

      if (credentialsPath?.trim()) {
        const fileJson = JSON.parse(
          readFileSync(credentialsPath, 'utf8'),
        ) as ServiceAccount;
        initializeApp({
          credential: cert(fileJson),
        });
        this.ready = true;
        this.logger.log(
          'Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS',
        );
        return;
      }

      this.logger.warn(
        'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS to enable push.',
      );
    } catch (error) {
      this.ready = false;
      this.logger.error(
        'Failed to initialize Firebase Admin',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendToUsers(
    userIds: string[],
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ) {
    if (!this.ready || userIds.length === 0) {
      return { sent: 0, failed: 0, skipped: true as const };
    }

    const tokens = await this.deviceTokens.listActiveTokensForUsers(userIds);
    if (tokens.length === 0) {
      return { sent: 0, failed: 0, skipped: false as const };
    }

    const response: BatchResponse = await getMessaging().sendEachForMulticast({
      tokens: tokens.map((row) => row.token),
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'dinepoint_alerts',
          sound: 'default',
        },
      },
      webpush: {
        fcmOptions: {
          link: '/',
        },
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/favicon.svg',
        },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((result, index) => {
      if (result.success) {
        return;
      }

      const code = result.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[index]!.token);
      } else {
        this.logger.warn(
          `FCM send failed for token index ${index}: ${result.error?.message ?? code}`,
        );
      }
    });

    if (invalidTokens.length > 0) {
      await this.deviceTokens.deactivateTokens(invalidTokens);
    }

    return {
      sent: response.successCount,
      failed: response.failureCount,
      skipped: false as const,
    };
  }
}
