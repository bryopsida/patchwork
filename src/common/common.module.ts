import { Module } from '@nestjs/common'
import { ConnOptionsService, TOKEN } from './conn-options.service'

export const TOKENS = {
  CONN_OPTIONS_SERVICE: TOKEN,
}
@Module({
  providers: [
    {
      provide: TOKENS.CONN_OPTIONS_SERVICE,
      useClass: ConnOptionsService,
    },
  ],
  exports: [
    {
      provide: TOKENS.CONN_OPTIONS_SERVICE,
      useClass: ConnOptionsService,
    },
  ],
})
export class CommonModule {}
