import { Processor, Process } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { ImageDescriptor } from '../kubernetes/k8s.service'
import { getManifest } from '@snyk/docker-registry-v2-client'
@Processor('analyzer.check.updates')
export class ImageDescriptorWorker {
  private readonly logger = new Logger(ImageDescriptorWorker.name)

  @Process()
  async fetchImageList(job: Job<ImageDescriptor>) {
    try {
      this.logger.log(
        `Checking for updates of ${job.data.repository}:${job.data.tag} used by ${job.data.owner.namespace}/${job.data.owner.type}/${job.data.owner.name}`
      )
      // split on / check for a . in the first snippet
      const parts = job.data.repository.split('/')
      // this may not be universarlly true
      const isDockerIo = parts[0].indexOf('.') === -1
      const registry = isDockerIo ? 'docker.io' : parts[0]
      const repo = isDockerIo
        ? job.data.repository
        : job.data.repository.substring(registry.length + 1)
      this.logger.log(
        `Fetching manifest for registry = ${registry}, repo = ${repo}, tag = ${job.data.tag}`
      )
      const manifest = await getManifest(registry, repo, job.data.tag)
      this.logger.log(
        `Fetched manifest digest = ${manifest?.config?.digest}, running hash = ${job.data.hash}`,
        manifest
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
