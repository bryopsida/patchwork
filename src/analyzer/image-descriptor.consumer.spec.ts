import { Test, TestingModule } from '@nestjs/testing'
import { RegistryService } from './registry.service'
import { ImageDescriptorWorker } from './image-descriptor.consumer'

describe('ImageDescriptorWorker', () => {
  let worker: ImageDescriptorWorker

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageDescriptorWorker],
    }).compile()

    worker = module.get<ImageDescriptorWorker>(RegistryService)
  })

  it('should be defined', () => {
    expect(worker).toBeDefined()
  })

  it('should push to queue when new image is available', async () => {})

  it('should push to queue when new image is available in private registry', () => {})
})
