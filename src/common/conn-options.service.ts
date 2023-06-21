import { Injectable, Logger } from '@nestjs/common'
import { RedisOptions, Transport } from '@nestjs/microservices'
import { MicroserviceHealthIndicatorOptions } from '@nestjs/terminus'
import { config } from 'dotenv'

export const TOKEN = 'CONN_OPTIONS_SERVICE'
// ensure process.env is hydrated
config({
  // items in .env take precedence
  override: true,
})
export interface IConnOptionsService {
  getRedisOptions(): RedisOptions & MicroserviceHealthIndicatorOptions
}

@Injectable()
export class ConnOptionsService implements IConnOptionsService {
  private readonly logger = new Logger(ConnOptionsService.name)

  getRedisOptions(): RedisOptions & MicroserviceHealthIndicatorOptions {
    const options = {
      host: process.env.PATCHWORK_REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.PATCHWORK_REDIS_PORT ?? '6379'),
      password: process.env.PATCHWORK_REDIS_PASSWORD ?? undefined,
    }
    this.logger.log(
      `Using redis host: ${options.host} on port ${options.port} for connections options, source from process.env.PATCHWORK_REDIS_HOST=${process.env.PATCHWORK_REDIS_HOST}, process.env.PATCHWORK_REDIS_PORT=${process.env.PATCHWORK_REDIS_PORT}`
    )
    return {
      transport: Transport.REDIS,
      options,
    }
  }
}
