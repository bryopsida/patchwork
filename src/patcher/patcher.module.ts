import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { UpdateWorker } from './update.consumer'
import { KubernetesModule } from '../kubernetes/kubernetes.module'
import { CommonModule } from 'src/common/common.module'
import { BackoffService } from './backoff.service'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'patcher.update',
    }),
    CommonModule,
    KubernetesModule,
  ],
  providers: [
    UpdateWorker,
    {
      provide: 'BACKOFF_SERVICE',
      useClass: BackoffService,
    },
  ],
})
export class PatcherModule {}
