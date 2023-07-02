import { Test, TestingModule } from '@nestjs/testing'
import { ConnOptionsService } from './conn-options.service'

describe('ConnOptionsService', () => {
  let service: ConnOptionsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnOptionsService],
    }).compile()

    service = module.get<ConnOptionsService>(ConnOptionsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
