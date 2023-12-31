import { Processor, Process, InjectQueue } from '@nestjs/bull'
import { Inject, Logger } from '@nestjs/common'
import { Job, Queue } from 'bull'
import { IK8sService, ImageDescriptor } from '../kubernetes/k8s.service'
import { getManifest, contentTypes } from '@snyk/docker-registry-v2-client'
@Processor('analyzer.check.updates')
export class ImageDescriptorWorker {
  private readonly logger = new Logger(ImageDescriptorWorker.name)
  private readonly patchQueue: Queue
  private readonly k8sService: IK8sService

  constructor(
    @InjectQueue('patcher.update') queue: Queue,
    @Inject('K8S_SERVICE') k8sService: IK8sService
  ) {
    this.patchQueue = queue
    this.k8sService = k8sService
  }

  @Process()
  async checkForUpdates(job: Job<ImageDescriptor>) {
    try {
      this.logger.debug(
        `Checking for updates of ${job.data.repository}:${
          job.data.tag
        } used by ${
          job.data.owner.namespace
        }/${job.data.owner.type.toString()}/${job.data.owner.name}`
      )
      // split on / check for a . in the first snippet
      const parts = job.data.repository.split('/')
      // this may not be universarlly true
      const isDockerIo = parts[0].indexOf('.') === -1
      const dockerIoRegistryDomain = 'registry-1.docker.io'
      const dockerIo = 'docker.io'
      const registry = isDockerIo
        ? 'registry-1.docker.io'
        : parts[0] === dockerIo
        ? dockerIoRegistryDomain
        : parts[0]
      const repo = isDockerIo
        ? parts.length === 1
          ? `library/${job.data.repository}`
          : job.data.repository
        : parts[0] === dockerIo
        ? job.data.repository.substring(dockerIo.length + 1)
        : job.data.repository.substring(registry.length + 1)
      this.logger.debug(
        `Fetching manifest for registry = ${registry}, repo = ${repo}, tag = ${job.data.tag}`
      )
      const reqOptions =
        registry === 'ghcr.io'
          ? {
              acceptManifest: `${contentTypes.MANIFEST_V2}, ${contentTypes.MANIFEST_LIST_V2}, ${contentTypes.OCI_INDEX_V1}, ${contentTypes.OCI_MANIFEST_V1}`,
            }
          : undefined
      let username
      let password
      if (job.data.pullSecret) {
        const creds = await this.k8sService.getPullSecretCredentials(job.data)
        username = creds.username
        password = creds.password
      }
      const manifest = await getManifest(
        registry,
        repo,
        job.data.tag,
        username,
        password,
        reqOptions,
        {
          os: 'linux',
          architecture: job.data.arch,
        }
      )
      if (
        manifest == null ||
        (manifest?.indexDigest == null && manifest.manifestDigest == null)
      ) {
        this.logger.warn(
          'Failed to get a workable manifest for %s with tag %s from registry %s',
          repo,
          job.data.tag,
          registry
        )
      }
      const digest = manifest.indexDigest ?? manifest.manifestDigest
      this.logger.debug(
        `Fetched manifest digest = ${digest}, running hash = ${job.data.hash}, repo = ${job.data.repository}`,
        manifest
      )
      if (digest !== job.data.hash && digest != null) {
        this.logger.warn(
          `Found an update for ${registry}/${repo}:${job.data.tag}`
        )
        // queueu work for the patcher
        await this.patchQueue.add({
          ...job.data,
          ...{
            currentSha: job.data.hash,
            targetSha: digest,
          },
        })
        return {
          detectedUpdate: true,
          current: job.data.hash,
          detectedLatest: digest,
        }
      } else {
        return {
          detectedUpdate: false,
          current: job.data.hash,
          detectedLatest: digest,
        }
      }
    } catch (err) {
      this.logger.error(
        `Error while checking for updates for ${job.data.repository}:${job.data.tag}: ${err.message}`,
        null,
        err
      )
      throw err
    }
  }
}
