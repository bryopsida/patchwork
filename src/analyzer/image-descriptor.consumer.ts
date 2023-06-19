import { Processor, Process } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { ImageDescriptor } from '../kubernetes/k8s.service'

@Processor('analyzer.check.updates')
export class ImageDescriptorWorker {
  private readonly logger = new Logger(ImageDescriptorWorker.name)

  @Process()
  async fetchImageList(job: Job<ImageDescriptor>) {
    try {
      this.logger.log(
        `Checking for updates of ${job.data.repository}:${job.data.tag} used by ${job.data.owner.namespace}/${job.data.owner.type}/${job.data.owner.name}`
      )
    } catch (err) {
      this.logger.error(
        `Error while checking for updates: ${err.message}`,
        null,
        err
      )
      throw err
    }
  }
}
