import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { RequireOrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';
import { OrganizationRoleGuard } from '../auth/guards/organization-role.guard.js';
import { CreateFloorDto } from './dto/create-floor.dto.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateFloorDto } from './dto/update-floor.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { FloorsService } from './floors.service.js';

@Controller('organizations/:organizationId/restaurants/:restaurantId/floors')
@UseGuards(JwtAuthGuard, OrganizationMemberGuard)
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  @Get()
  list(
    @Param('organizationId') organizationId: string,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.floorsService.listFloors(organizationId, restaurantId);
  }

  @Post()
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  create(
    @Param('organizationId') organizationId: string,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateFloorDto,
  ) {
    return this.floorsService.createFloor(organizationId, restaurantId, dto);
  }

  @Patch(':floorId')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  update(
    @Param('organizationId') organizationId: string,
    @Param('restaurantId') restaurantId: string,
    @Param('floorId') floorId: string,
    @Body() dto: UpdateFloorDto,
  ) {
    return this.floorsService.updateFloor(organizationId, restaurantId, floorId, dto);
  }

  @Get(':floorId/rooms')
  listRooms(
    @Param('organizationId') organizationId: string,
    @Param('restaurantId') restaurantId: string,
    @Param('floorId') floorId: string,
  ) {
    return this.floorsService.listRooms(organizationId, restaurantId, floorId);
  }

  @Post(':floorId/rooms')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  createRoom(
    @Param('organizationId') organizationId: string,
    @Param('restaurantId') restaurantId: string,
    @Param('floorId') floorId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.floorsService.createRoom(organizationId, restaurantId, floorId, dto);
  }

  @Patch(':floorId/rooms/:roomId')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  updateRoom(
    @Param('organizationId') organizationId: string,
    @Param('restaurantId') restaurantId: string,
    @Param('floorId') floorId: string,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.floorsService.updateRoom(
      organizationId,
      restaurantId,
      floorId,
      roomId,
      dto,
    );
  }
}
