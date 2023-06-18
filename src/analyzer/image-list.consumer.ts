import { Processor, Process } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'

@Processor('analyzer.fetch.imagelist')
export class ImageListWorker {
  private readonly logger = new Logger(ImageListWorker.name)

  @Process()
  async fetchImageList(job: Job<unknown>) {
    this.logger.log('Fetching list of images')
    return {}
  }
}
