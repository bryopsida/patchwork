import { Module } from '@nestjs/common'
import { ImageService } from './image.service'
import { RegistryService } from './registry.service'
import { BullModule } from '@nestjs/bull'
import { ImageListWorker } from './image-list.consumer'
import { TaskRegisterService } from './task-register.service'
import { KubernetesModule } from 'src/kubernetes/kubernetes.module'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'analyzer.fetch.imagelist',
    }),
    BullModule.registerQueue({
      name: 'analyzer.check.updates',
    }),
    KubernetesModule,
  ],
  providers: [
    ImageService,
    RegistryService,
    ImageListWorker,
    TaskRegisterService,
  ],
})
export class AnalyzerModule {}
