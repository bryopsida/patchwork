import { Test, TestingModule } from '@nestjs/testing'
import { BackoffService } from './backoff.service'
import { CommonModule } from '../common/common.module'

describe('BackoffService', () => {
  let service: BackoffService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [BackoffService],
    }).compile()

    service = module.get<BackoffService>(BackoffService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
