import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
  } from '@nestjs/common';
  import { OrganizationRole } from '@prisma/client';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
  import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
  import { OrganizationRoleGuard } from '../auth/guards/organization-role.guard.js';
  import { RequireOrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
  import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
  import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
  
  import { RestaurantsService } from './restaurants.service.js';
  import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
  import {
    SetRestaurantPublishedDto,
    UpdateRestaurantDto,
  } from './dto/update-restaurant.dto.js';
  
  @Controller('organizations/:organizationId/restaurants')
  @UseGuards(JwtAuthGuard, OrganizationMemberGuard)
  export class RestaurantsController {
    constructor(
      private readonly restaurantsService: RestaurantsService,
    ) {}
  
    @Post()
    @UseGuards(OrganizationRoleGuard)
    @RequireOrganizationRoles(
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    )
    create(
      @Param('organizationId') organizationId: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() dto: CreateRestaurantDto,
    ) {
      return this.restaurantsService.create(
        organizationId,
        user.id,
        dto,
      );
    }
  
    @Get()
    findAll(
      @Param('organizationId') organizationId: string,
    ) {
      return this.restaurantsService.findAll(organizationId);
    }
  
    @Get(':restaurantId')
    findOne(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
    ) {
      return this.restaurantsService.findOne(
        organizationId,
        restaurantId,
      );
    }
  
    @Patch(':restaurantId')
    @UseGuards(OrganizationRoleGuard)
    @RequireOrganizationRoles(
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    )
    update(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() dto: UpdateRestaurantDto,
    ) {
      return this.restaurantsService.update(
        organizationId,
        user.id,
        restaurantId,
        dto,
      );
    }
  
    @Patch(':restaurantId/publishing')
    @UseGuards(OrganizationRoleGuard)
    @RequireOrganizationRoles(
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    )
    setPublished(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() dto: SetRestaurantPublishedDto,
    ) {
      return this.restaurantsService.setPublished(
        organizationId,
        user.id,
        restaurantId,
        dto.isPublished,
      );
    }
  }