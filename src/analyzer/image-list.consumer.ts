import { Processor, Process } from '@nestjs/bull'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bull'
import { IK8sService } from 'src/kubernetes/k8s.service'

@Processor('analyzer.fetch.imagelist')
export class ImageListWorker {
  private readonly logger = new Logger(ImageListWorker.name)
  private readonly k8sService: IK8sService

  constructor(@Inject('K8S_SERVICE') k8sService: IK8sService) {
    this.k8sService = k8sService
  }

  @Process()
  async fetchImageList(job: Job<unknown>) {
    try {
      this.logger.log('Fetching list of images')
      const images = await this.k8sService.getImageList()
      this.logger.log('Found images', images)
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
