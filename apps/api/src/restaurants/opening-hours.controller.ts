
import {
    Body,
    Controller,
    Get,
    Param,
    Put,
    UseGuards,
  } from '@nestjs/common';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
  import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
  import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
  import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
  
  import { OpeningHoursService } from './opening-hours.service.js';
  import { UpsertOpeningHourDto } from './dto/upsert-opening-hour.dto.js';
  
  @Controller(
    'organizations/:organizationId/restaurants/:restaurantId/opening-hours',
  )
  @UseGuards(JwtAuthGuard, OrganizationMemberGuard)
  export class OpeningHoursController {
    constructor(
      private readonly openingHoursService: OpeningHoursService,
    ) {}
  
    @Get()
    list(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
    ) {
      return this.openingHoursService.list(
        organizationId,
        restaurantId,
      );
    }
  
    @Put()
    upsert(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() dto: UpsertOpeningHourDto,
    ) {
      return this.openingHoursService.upsert(
        organizationId,
        user.id,
        restaurantId,
        dto,
      );
    }
  }
  