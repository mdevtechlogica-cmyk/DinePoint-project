
import { Test, TestingModule } from '@nestjs/testing';
import { TablesController } from './tables.controller.js';
import { TablesService } from './tables.service.js';
import { OrganizationMemberGuard } from '../auth/guards/organization-member.guard.js';

describe('TablesController', () => {
  let controller: TablesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TablesController],
      providers: [
        { provide: TablesService, useValue: {} },
      ],
    })
      .overrideGuard(OrganizationMemberGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TablesController>(TablesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
