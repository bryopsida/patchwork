import { Injectable } from '@nestjs/common'
import { RedisOptions, Transport } from '@nestjs/microservices'
import { MicroserviceHealthIndicatorOptions } from '@nestjs/terminus'
import { config } from 'dotenv'

// ensure process.env is hydrated
config()

@Injectable()
export class ConnOptionsService {
  getRedisOptions(): RedisOptions & MicroserviceHealthIndicatorOptions {
    return {
      transport: Transport.REDIS,
      options: {
        host: process.env.PATCHWORK_REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.PATCHWORK_REDIS_PORT ?? '6379'),
        password: process.env.PATCHWORK_REDIS_PASSWORD ?? undefined,
      },
    }
  }
}
