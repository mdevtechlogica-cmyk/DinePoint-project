import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
  } from '@nestjs/common';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
  import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
  import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
  import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
  
  import { TablesService } from './tables.service.js';
  import { CreateTableDto } from './dto/create-table.dto.js';
  import { UpdateTableDto } from './dto/update-table.dto.js';
  
  @Controller(
    'organizations/:organizationId/restaurants/:restaurantId/tables',
  )
  @UseGuards(JwtAuthGuard, OrganizationMemberGuard)
  export class TablesController {
    constructor(private readonly tablesService: TablesService) {}
  
    @Post()
    create(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() dto: CreateTableDto,
    ) {
      return this.tablesService.create(
        organizationId,
        user.id,
        restaurantId,
        dto,
      );
    }
  
    @Get()
    findAll(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
    ) {
      return this.tablesService.findAll(
        organizationId,
        restaurantId,
      );
    }
  
    @Patch(':tableId')
    update(
      @Param('organizationId') organizationId: string,
      @Param('restaurantId') restaurantId: string,
      @Param('tableId') tableId: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() dto: UpdateTableDto,
    ) {
      return this.tablesService.update(
        organizationId,
        user.id,
        restaurantId,
        tableId,
        dto,
      );
    }
  }