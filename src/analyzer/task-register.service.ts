import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Timeout } from '@nestjs/schedule'
import { Queue } from 'bull'

@Injectable()
export class TaskRegisterService {
  private readonly logger = new Logger(TaskRegisterService.name)
  private readonly fetchImageListQueue: Queue

  constructor(@InjectQueue('analyzer.fetch.imagelist') fetchImageList: Queue) {
    this.fetchImageListQueue = fetchImageList
  }

  @Timeout(5000)
  async handleTimeout(): Promise<void> {
    this.logger.log('Ensuring fetch image list job is registered in queue')
    await this.fetchImageListQueue.add(
      {},
      {
        repeat: {
          every: 15000,
        },
        attempts: -1,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        jobId: 'fetch-image-list',
      }
    )
  }
}
