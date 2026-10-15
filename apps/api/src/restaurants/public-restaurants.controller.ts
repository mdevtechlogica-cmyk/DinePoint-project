
import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicRestaurantsService } from './public-restaurants.service.js';

@Controller('public/restaurants')
export class PublicRestaurantsController {
  constructor(
    private readonly publicRestaurantsService: PublicRestaurantsService,
  ) {}

  @Get()
  search(
    @Query('city') city?: string,
    @Query('search') search?: string,
  ) {
    return this.publicRestaurantsService.searchRestaurants(
      city,
      search,
    );
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.publicRestaurantsService.getRestaurantBySlug(slug);
  }
}
