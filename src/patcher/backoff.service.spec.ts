import { Test, TestingModule } from '@nestjs/testing'
import { BackoffService } from './backoff.service'
import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { IConnOptionsService } from '../common/conn-options.service'
import { Transport } from '@nestjs/microservices'
import { ResourceType } from '../kubernetes/k8s.service'

describe('BackoffService', () => {
  let service: BackoffService
  let module: TestingModule
  let container: StartedTestContainer

  beforeAll(async () => {
    container = await new GenericContainer('redis')
      .withExposedPorts(6379)
      .start()
  }, 60000)

  afterAll(async () => {
    await container.stop()
  })
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        BackoffService,
        {
          provide: 'CONN_OPTIONS_SERVICE',
          useValue: {
            getRedisOptions: () => {
              return {
                transport: Transport.REDIS,
                options: {
                  host: 'localhost',
                  port: container.getFirstMappedPort(),
                },
              }
            },
          } as IConnOptionsService,
        },
      ],
    }).compile()

    service = module.get<BackoffService>(BackoffService)
  })
  afterEach(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should allow resources to be restarted outside the graceperiod', async () => {
    const isAllowed = await service.canIUpdate({
      owner: {
        name: 'ALLOWED_NAME',
        namespace: 'TEST_NAMESPACE',
        type: ResourceType.DAEMONSET,
      },
    } as any)
    expect(isAllowed).toBeTruthy()
  })

  it('should block resources inside the graceperiod from being restarted', async () => {
    const descriptor = {
      owner: {
        name: 'NOT_ALLOWED_NAME',
        namespace: 'TEST_NAMESPACE',
        type: ResourceType.DAEMONSET,
      },
    } as any
    await service.canIUpdate(descriptor)
    const isAllowed = await service.canIUpdate(descriptor)
    expect(isAllowed).toBeFalsy()
  })
})
