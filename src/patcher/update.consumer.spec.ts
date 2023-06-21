import { Test, TestingModule } from '@nestjs/testing'
import {
  ImageDescriptor,
  Resource,
  ResourceType,
} from '../kubernetes/k8s.service'
import { UpdateWorker } from './update.consumer'

describe('UpdateWorker', () => {
  let service: UpdateWorker
  let module: TestingModule
  let fakeK8s

  beforeEach(async () => {
    fakeK8s = {
      triggerRollingUpdate: jest.fn(),
    }
    module = await Test.createTestingModule({
      providers: [
        {
          provide: 'K8S_SERVICE',
          useValue: fakeK8s,
        },
        {
          provide: 'BACKOFF_SERVICE',
          useValue: {
            canIUpdate: (descriptor: ImageDescriptor): Promise<boolean> => {
              if (descriptor.owner.name === 'TEST_1')
                return Promise.resolve(false)
              return Promise.resolve(true)
            },
          },
        },
        UpdateWorker,
      ],
    }).compile()

    service = module.get<UpdateWorker>(UpdateWorker)
  })
  afterEach(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should not update when inside graceperiod', async () => {
    const result = await service.rollout({
      data: {
        owner: {
          name: 'TEST_1',
          namespace: 'TEST_NAMESPACE_1',
          type: ResourceType.DAEMONSET,
        } as Resource,
      },
    } as unknown as any)
    expect(result.updateScheduled).toBeFalsy()
    expect(fakeK8s.triggerRollingUpdate.mock.calls.length).toBe(0)
  })

  it('should update when outside the graceperiod', async () => {
    const result = await service.rollout({
      data: {
        owner: {
          name: 'TEST_2',
          namespace: 'TEST_NAMESPACE_2',
          type: ResourceType.DAEMONSET,
        } as Resource,
      },
    } as unknown as any)
    expect(result.updateScheduled).toBeTruthy()
    expect(fakeK8s.triggerRollingUpdate.mock.calls.length).toBe(1)
  })
})
