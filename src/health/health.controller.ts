import { Controller, Get } from '@nestjs/common'
import {
  HealthCheckService,
  MemoryHealthIndicator,
  HealthCheck,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus'
import { ConnOptionsService } from '../common/conn-options.service'

@Controller('health')
export class HealthController {
  private readonly health: HealthCheckService
  private readonly memory: MemoryHealthIndicator
  private readonly microservice: MicroserviceHealthIndicator
  private readonly connOptions: ConnOptionsService

  constructor(
    health: HealthCheckService,
    memory: MemoryHealthIndicator,
    microservice: MicroserviceHealthIndicator,
    connOptions: ConnOptionsService
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
