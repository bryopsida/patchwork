import { Module } from '@nestjs/common';
import { FetchService } from './fetch.service';
import { RolloutService } from './rollout.service';

@Module({
  providers: [FetchService, RolloutService]
})
export class PatcherModule {}
