import { Controller, Get, Inject } from '@nestjs/common'
import {
  HealthCheckService,
  MemoryHealthIndicator,
  HealthCheck,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus'
import { IConnOptionsService, TOKEN } from '../common/conn-options.service'

@Controller('health')
export class HealthController {
  private readonly health: HealthCheckService
  private readonly memory: MemoryHealthIndicator
  private readonly microservice: MicroserviceHealthIndicator
  private readonly connOptions: IConnOptionsService

  constructor(
    health: HealthCheckService,
    memory: MemoryHealthIndicator,
    microservice: MicroserviceHealthIndicator,
    @Inject(TOKEN) connOptions: IConnOptionsService
  ) {
    this.health = health
    this.memory = memory
    this.microservice = microservice
    this.connOptions = connOptions
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () =>
        this.microservice.pingCheck(
          'redis',
          this.connOptions.getRedisOptions()
        ),
    ])
  }
}
