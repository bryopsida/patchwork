import { Module } from '@nestjs/common'
import { ImageService } from './image.service'
import { RegistryService } from './registry.service'
import { BullModule } from '@nestjs/bull'
import { ImageListWorker } from './image-list.consumer'
import { TaskRegisterService } from './task-register.service'
import { KubernetesModule } from 'src/kubernetes/kubernetes.module'
import { ImageDescriptorWorker } from './image-descriptor.consumer'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'analyzer.fetch.imagelist',
    }),
    BullModule.registerQueue({
      name: 'analyzer.check.updates',
    }),
    BullModule.registerQueue({
      name: 'patcher.update',
    }),
    KubernetesModule,
  ],
  providers: [
    ImageDescriptorWorker,
    ImageService,
    RegistryService,
    ImageListWorker,
    TaskRegisterService,
  ],
})
export class AnalyzerModule {}
