import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { Redis } from 'ioredis'
import { IConnOptionsService } from '../common/conn-options.service'
import { ImageDescriptor } from '../kubernetes/k8s.service'

export interface IBackoffService {
  canIUpdate(descriptor: ImageDescriptor): Promise<boolean>
}

@Injectable()
export class BackoffService implements OnModuleDestroy, IBackoffService {
  private readonly redis: Redis

  constructor(
    @Inject('CONN_OPTIONS_SERVICE') connOptions: IConnOptionsService
  ) {
    const options = connOptions.getRedisOptions()
    this.redis = new Redis(options.options.port, options.options.host)
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit()
  }

  async canIUpdate(descriptor: ImageDescriptor): Promise<boolean> {
    const key = `patchwork:${descriptor.owner.namespace}:${descriptor.owner.type}:${descriptor.owner.name}:lastRestart`
    const lastRestart = await this.redis.get(key)
    if (lastRestart != null) {
      return false
    } else {
      await this.redis.set(
        key,
        new Date().toISOString(),
        'EX',
        parseInt(process.env.PATCHWORK_RESTART_GRACE_PERIOD_SECONDS ?? '3600')
      )
      return true
    }
  }
}
