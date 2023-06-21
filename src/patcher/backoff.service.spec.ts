import { Test, TestingModule } from '@nestjs/testing'
import { BackoffService } from './backoff.service'
import { CommonModule } from '../common/common.module'

describe('BackoffService', () => {
  let service: BackoffService
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [BackoffService],
    }).compile()

    service = module.get<BackoffService>(BackoffService)
  })
  afterEach(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
