import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { DeviceTokensService } from './device-tokens.service.js';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto.js';
import { UnregisterDeviceTokenDto } from './dto/unregister-device-token.dto.js';

@Controller('device-tokens')
@UseGuards(JwtAuthGuard)
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.deviceTokensService.register(user.id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  unregister(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnregisterDeviceTokenDto,
  ) {
    return this.deviceTokensService.unregister(user.id, dto.token);
  }
}
