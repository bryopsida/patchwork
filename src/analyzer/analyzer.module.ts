import { Module } from '@nestjs/common'
import { ImageService } from './image.service'
import { RegistryService } from './registry.service'

@Module({
  providers: [ImageService, RegistryService],
})
export class AnalyzerModule {}
