import { Module } from '@nestjs/common'
import { ConnOptionsService } from './conn-options.service'

@Module({
  providers: [ConnOptionsService],
  exports: [
    {
      provide: 'CONN_OPTIONS_SERVICE',
      useClass: ConnOptionsService,
    },
  ],
})
export class CommonModule {}
