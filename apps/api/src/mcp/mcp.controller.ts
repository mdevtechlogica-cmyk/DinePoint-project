
import {
    All,
    Controller,
    ForbiddenException,
    NotFoundException,
    Req,
    Res,
    UseGuards,
  } from '@nestjs/common';
  import type { Request, Response } from 'express';
  import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
  import { toNodeHandler } from '@modelcontextprotocol/node';
  import * as z from 'zod/v4';
  
  import { ApiKeyAuthGuard } from '../api-keys/guards/api-key-auth.guard.js';
  import { PrismaService } from '../prisma/prisma.service.js';
  
  type McpRequest = Request & {
    apiKey?: {
      id: string;
      organizationId: string;
      scopes: string[];
    };
  };
  
  const paginationSchema = z.object({
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().min(1).max(128).optional(),
  });
  
  type Pagination = z.infer<typeof paginationSchema>;
  
  const errorResult = (message: string) => ({
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  });
  
  @Controller('mcp')
  @UseGuards(ApiKeyAuthGuard)
  export class McpController {
    constructor(private readonly prisma: PrismaService) {}
  
    @All()
    async handle(
      @Req() request: McpRequest,
      @Res() response: Response,
    ): Promise<void> {
      const apiKey = request.apiKey;
  
      if (!apiKey) {
        throw new ForbiddenException('API key context missing');
      }
  
      const server = new McpServer({
        name: 'dinepoint',
        version: '0.1.0',
      });
  
      const requireScope = (scope: string): boolean =>
        apiKey.scopes.includes(scope);
  
      const getPageArgs = (input: Pagination) => {
        const limit = input.limit ?? 50;
  
        return {
          limit,
          take: limit + 1,
          ...(input.cursor
            ? { cursor: { id: input.cursor }, skip: 1 }
            : {}),
        };
      };
  
      const buildPage = <T extends { id: string }>(
        rows: T[],
        limit: number,
      ) => {
        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;
  
        return {
          data,
          nextCursor:
            hasMore && data.length > 0
              ? data[data.length - 1].id
              : null,
        };
      };
  
      const assertRestaurantAccess = async (
        restaurantId: string,
      ): Promise<void> => {
        const restaurant = await this.prisma.restaurant.findFirst({
          where: {
            id: restaurantId,
            isActive: true,
            branch: {
              organizationId: apiKey.organizationId,
              isActive: true,
              organization: { isActive: true },
            },
          },
          select: { id: true },
        });
  
        if (!restaurant) {
          throw new NotFoundException('Restaurant not found');
        }
      };
  
      server.registerTool(
        'list_restaurants',
        {
          description:
            'List active restaurants belonging to the authenticated organization. Supports limit and cursor pagination.',
          inputSchema: paginationSchema,
        },
        async (input) => {
          if (!requireScope('restaurants:read')) {
            return errorResult('API key requires restaurants:read scope');
          }
  
          try {
            const page = getPageArgs(input);
  
            if (input.cursor) {
              const cursorRecord =
                await this.prisma.restaurant.findFirst({
                  where: {
                    id: input.cursor,
                    isActive: true,
                    branch: {
                      organizationId: apiKey.organizationId,
                      isActive: true,
                      organization: { isActive: true },
                    },
                  },
                  select: { id: true },
                });
  
              if (!cursorRecord) {
                return errorResult('Invalid or inaccessible cursor');
              }
            }
  
            const rows = await this.prisma.restaurant.findMany({
              where: {
                isActive: true,
                branch: {
                  organizationId: apiKey.organizationId,
                  isActive: true,
                  organization: { isActive: true },
                },
              },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                city: true,
                state: true,
                country: true,
                isPublished: true,
                branch: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                    timezone: true,
                  },
                },
              },
              orderBy: [{ name: 'asc' }, { id: 'asc' }],
              take: page.take,
              ...(input.cursor
                ? { cursor: { id: input.cursor }, skip: 1 }
                : {}),
            });
  
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(buildPage(rows, page.limit)),
              }],
            };
          } catch {
            return errorResult('Unable to list restaurants');
          }
        },
      );
  
      server.registerTool(
        'list_tables',
        {
          description:
            'List active tables for a restaurant accessible to the authenticated organization.',
          inputSchema: paginationSchema.extend({
            restaurantId: z.string().min(1).max(128),
          }),
        },
        async (input) => {
          if (!requireScope('tables:read')) {
            return errorResult('API key requires tables:read scope');
          }
  
          try {
            await assertRestaurantAccess(input.restaurantId);
  
            const page = getPageArgs(input);
  
            if (input.cursor) {
              const cursorRecord =
                await this.prisma.restaurantTable.findFirst({
                  where: {
                    id: input.cursor,
                    restaurantId: input.restaurantId,
                    isActive: true,
                    restaurant: {
                      branch: {
                        organizationId: apiKey.organizationId,
                        isActive: true,
                        organization: { isActive: true },
                      },
                    },
                  },
                  select: { id: true },
                });
  
              if (!cursorRecord) {
                return errorResult('Invalid or inaccessible cursor');
              }
            }
  
            const rows = await this.prisma.restaurantTable.findMany({
              where: {
                restaurantId: input.restaurantId,
                isActive: true,
                restaurant: {
                  branch: {
                    organizationId: apiKey.organizationId,
                    isActive: true,
                    organization: { isActive: true },
                  },
                },
              },
              select: {
                id: true,
                tableNumber: true,
                seats: true,
                floorNumber: true,
                roomName: true,
                isAc: true,
                isFamilyFriendly: true,
              },
              orderBy: [
                { floorNumber: 'asc' },
                { tableNumber: 'asc' },
                { id: 'asc' },
              ],
              take: page.take,
              ...(input.cursor
                ? { cursor: { id: input.cursor }, skip: 1 }
                : {}),
            });
  
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(buildPage(rows, page.limit)),
              }],
            };
          } catch {
            return errorResult('Unable to list tables');
          }
        },
      );
  
      server.registerTool(
        'list_reservations',
        {
          description:
            'List reservations for an accessible restaurant. Guest contact details are not returned.',
          inputSchema: paginationSchema.extend({
            restaurantId: z.string().min(1).max(128),
          }),
        },
        async (input) => {
          if (!requireScope('reservations:read')) {
            return errorResult(
              'API key requires reservations:read scope',
            );
          }
  
          try {
            await assertRestaurantAccess(input.restaurantId);
  
            const page = getPageArgs(input);
  
            if (input.cursor) {
              const cursorRecord =
                await this.prisma.reservation.findFirst({
                  where: {
                    id: input.cursor,
                    restaurantId: input.restaurantId,
                    restaurant: {
                      branch: {
                        organizationId: apiKey.organizationId,
                        isActive: true,
                        organization: { isActive: true },
                      },
                    },
                  },
                  select: { id: true },
                });
  
              if (!cursorRecord) {
                return errorResult('Invalid or inaccessible cursor');
              }
            }
  
            const rows = await this.prisma.reservation.findMany({
              where: {
                restaurantId: input.restaurantId,
                restaurant: {
                  branch: {
                    organizationId: apiKey.organizationId,
                    isActive: true,
                    organization: { isActive: true },
                  },
                },
              },
              select: {
                id: true,
                startsAt: true,
                endsAt: true,
                guestCount: true,
                status: true,
                seatingPreference: true,
                coolingPreference: true,
                tables: {
                  select: {
                    table: {
                      select: {
                        tableNumber: true,
                        floorNumber: true,
                      },
                    },
                  },
                },
              },
              orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
              take: page.take,
              ...(input.cursor
                ? { cursor: { id: input.cursor }, skip: 1 }
                : {}),
            });
  
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(buildPage(rows, page.limit)),
              }],
            };
          } catch {
            return errorResult('Unable to list reservations');
          }
        },
      );
  
      const handler = createMcpHandler(() => server);
      const nodeHandler = toNodeHandler(handler);
  
      nodeHandler(request, response, request.body);
    }
  }
  