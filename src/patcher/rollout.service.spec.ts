import { Test, TestingModule } from '@nestjs/testing';
import { RolloutService } from './rollout.service';

describe('RolloutService', () => {
  let service: RolloutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolloutService],
    }).compile();

    service = module.get<RolloutService>(RolloutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
