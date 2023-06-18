import { Module } from '@nestjs/common'
import { ConnOptionsService } from './conn-options.service'

@Module({
  providers: [ConnOptionsService],
  exports: [ConnOptionsService],
})
export class CommonModule {}
