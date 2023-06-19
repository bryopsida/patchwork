import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { UpdateWorker } from './update.consumer'
import { KubernetesModule } from 'src/kubernetes/kubernetes.module'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'patcher.update',
    }),
    KubernetesModule,
  ],
  providers: [UpdateWorker],
})
export class PatcherModule {}
