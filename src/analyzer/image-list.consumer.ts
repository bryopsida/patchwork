import { Processor, Process, InjectQueue } from '@nestjs/bull'
import { Inject, Logger } from '@nestjs/common'
import { Job, Queue } from 'bull'
import { IK8sService } from 'src/kubernetes/k8s.service'

@Processor('analyzer.fetch.imagelist')
export class ImageListWorker {
  private readonly logger = new Logger(ImageListWorker.name)
  private readonly k8sService: IK8sService
  private readonly updateCheckQueue: Queue

  constructor(
    @Inject('K8S_SERVICE') k8sService: IK8sService,
    @InjectQueue('analyzer.check.updates') queue: Queue
  ) {
    this.k8sService = k8sService
    this.updateCheckQueue = queue
  }

  @Process()
  async fetchImageList(job: Job<unknown>) {
    try {
      this.logger.log('Fetching list of images')
      const images = await this.k8sService.getImageList()
      this.logger.log('Found images', images)
      // push jobs into the queue
      for (const image of images) {
        await this.updateCheckQueue.add(image, {
          attempts: 3,
        })
      }
      return {
        images,
      }
    } catch (err) {
      this.logger.error(
        `Error while fetching image list: ${err.message}`,
        null,
        err
      )
      throw err
    }
  }
}
