import { Processor, Process } from '@nestjs/bull'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bull'
import { IK8sService, ImageDescriptor } from '../kubernetes/k8s.service'
import { BackoffService } from './backoff.service'

export interface ImageDescriptorUpdate extends ImageDescriptor {
  currentSha: string
  targetSha: string
}

@Processor('patcher.update')
export class UpdateWorker {
  private readonly logger = new Logger(UpdateWorker.name)
  private readonly k8sService: IK8sService
  private readonly backoffService: BackoffService

  constructor(
    @Inject('K8S_SERVICE') k8s: IK8sService,
    backoff: BackoffService
  ) {
    this.k8sService = k8s
    this.backoffService = backoff
  }

  @Process()
  async rollout(job: Job<ImageDescriptorUpdate>) {
    try {
      // check if we can restart the thing
      const canWeBump = await this.backoffService.canIUpdate(job.data)
      if (!canWeBump) {
        this.logger.warn(
          `${job.data.owner.namespace}/${job.data.owner.name} has been recently restarted and is still inside its grace period, skipping rollout`
        )
        return {
          updateScheduled: false,
        }
      }
      this.logger.warn(
        `Triggerring rolling update to pull in patches on resouce ${job.data.owner.namespace}/${job.data.owner.name} to update from ${job.data.currentSha} to ${job.data.targetSha}`
      )
      await this.k8sService.triggerRollingUpdate(job.data.owner)
      return {
        updateScheduled: true,
      }
    } catch (err) {
      this.logger.error(
        `Error while triggerring rollout: ${err.message}`,
        null,
        err
      )
      throw err
    }
  }
}
