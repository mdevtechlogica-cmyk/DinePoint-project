
import {
    Controller,
    Get,
    Param,
    Patch,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
    UseGuards,
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
  import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
  import { NotificationsService } from './notifications.service.js';
  
  @Controller('notifications')
  @UseGuards(JwtAuthGuard)
  export class NotificationsController {
    constructor(
      private readonly notificationsService: NotificationsService,
    ) {}
  
    @Get()
    list(
      @CurrentUser() user: { id: string },
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
      return this.notificationsService.listForUser(
        user.id,
        page,
        limit,
      );
    }
  
    @Patch(':notificationId/read')
    markAsRead(
      @CurrentUser() user: { id: string },
      @Param('notificationId') notificationId: string,
    ) {
      return this.notificationsService.markAsRead(
        user.id,
        notificationId,
      );
    }
  }
  