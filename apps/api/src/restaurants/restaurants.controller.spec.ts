
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsController } from './restaurants.controller.js';
import { RestaurantsService } from './restaurants.service.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

describe('RestaurantsController', () => {
  let controller: RestaurantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantsController],
      providers: [
        { provide: RestaurantsService, useValue: {} },
      ],
    })
      .overrideGuard(OrganizationMemberGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RestaurantsController>(RestaurantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
