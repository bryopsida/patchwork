import { Test, TestingModule } from '@nestjs/testing'
import { K8sService } from './k8s.service'

describe('K8sService', () => {
  let service: K8sService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        K8sService,
        {
          provide: 'K8S_CONFIG',
          useValue: {
            makeApiClient: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<K8sService>(K8sService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
