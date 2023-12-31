import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  AppsV1Api,
  CoreV1Api,
  KubeConfig,
  V1Container,
  V1DaemonSet,
  V1Deployment,
  V1LabelSelector,
  V1Pod,
  V1StatefulSet,
  PatchUtils,
  V1Node,
} from '@kubernetes/client-node'
import { parse } from 'psl'

export enum ResourceType {
  // eslint-disable-next-line no-unused-vars
  DEPLOYMENT = 'deployment',
  // eslint-disable-next-line no-unused-vars
  STATEFULSET = 'statefulset',
  // eslint-disable-next-line no-unused-vars
  DAEMONSET = 'daemonset',
}

export interface Resource {
  type: ResourceType
  name: string
  namespace: string
}

export interface PullCredentials {
  username: string
  password: string
}

export interface ImageDescriptor {
  repository: string
  tag: string
  hash: string
  owner: Resource
  nodes: string[]
  arch: string
  pullSecret: string
  pullPolicy: string
}

export interface IK8sService {
  getImageList(): Promise<Array<ImageDescriptor>>
  triggerRollingUpdate(resource: Resource): Promise<void>
  getPullSecretCredentials(
    descriptor: ImageDescriptor
  ): Promise<PullCredentials>
}

interface IPullSecretMap {
  containers: Record<string, string>
}

function getSelector(
  controllerObj: V1StatefulSet | V1Deployment | V1DaemonSet
): V1LabelSelector {
  return controllerObj.spec.selector
}
async function getNode(
  nodeNode: string,
  coreClient: CoreV1Api
): Promise<V1Node> {
  const node = await coreClient.readNode(nodeNode)
  return node.body
}

async function getFirstPod(
  selector: V1LabelSelector,
  namespace: string,
  client: CoreV1Api
): Promise<V1Pod> {
  let selectorString = ''
  for (const [key, value] of Object.entries(selector.matchLabels)) {
    if (selectorString.length !== 0) {
      selectorString += ','
    }
    selectorString += `${key}=${value}`
  }
  const resp = await client.listNamespacedPod(
    namespace,
    null,
    null,
    null,
    null,
    selectorString
  )
  if (resp.body.items.length === 0) return null
  return resp.body.items[0]
}

function getImageRepo(container: V1Container): string {
  return container.image.split(':')[0]
}

function getImageTag(container: V1Container): string {
  const repo = getImageRepo(container)
  return container.image.substring(repo.length + 1).split('@')[0]
}

function getImageHash(container: V1Container, pod: V1Pod): string {
  const matchedStatuses = pod.status.containerStatuses.filter(
    (status) => status.name === container.name && status.started
  )
  return matchedStatuses[0].imageID.split('@')[1]
}

function getPullPolicy(container: V1Container): string {
  return container.imagePullPolicy
}

function getResourceType(
  controllerObj: V1StatefulSet | V1Deployment | V1DaemonSet
): ResourceType {
  if (controllerObj instanceof V1StatefulSet) {
    return ResourceType.STATEFULSET
  } else if (controllerObj instanceof V1DaemonSet) {
    return ResourceType.DAEMONSET
  } else if (controllerObj instanceof V1Deployment) {
    return ResourceType.DEPLOYMENT
  }
}

async function getPullSecretMap(
  pod: V1Pod,
  client: CoreV1Api
): Promise<IPullSecretMap> {
  if (pod.spec.imagePullSecrets) {
    const ret = {
      containers: {},
    }
    for (const pullSecret of pod.spec.imagePullSecrets) {
      const secretResponse = await client.readNamespacedSecret(
        pullSecret.name,
        pod.metadata.namespace
      )
      const secret = secretResponse.body
      const dockerConfig = JSON.parse(
        Buffer.from(secret.data['.dockerconfigjson'], 'base64').toString(
          'utf-8'
        )
      )
      const registries = Object.keys(dockerConfig.auths).map((url) =>
        parse(url)
      )
      for (const reg of registries) {
        for (const cont of pod.spec.containers) {
          if (cont.image.indexOf(reg.domain as string) !== -1) {
            ret.containers[cont.name] = pullSecret.name
          }
        }
      }
    }
    return ret
  } else {
    return {
      containers: {},
    }
  }
}

async function getImageDescriptors(
  controllerObj: V1StatefulSet | V1Deployment | V1DaemonSet,
  coreClient: CoreV1Api
): Promise<ImageDescriptor[]> {
  // step 1 get the selector so we can fetch its pods
  const selector = getSelector(controllerObj)
  // fetch a pod, we can just grab the first one, ideally they should be identical, there could be  rollouts or other things that make this not
  // the case but for now we are going to assume this and deal with handling more complicated cases later
  const pod = await getFirstPod(
    selector,
    controllerObj.metadata.namespace,
    coreClient
  )

  const pullSecrets = await getPullSecretMap(pod, coreClient)

  const node = await getNode(pod.spec.nodeName, coreClient)
  return pod.spec.containers.map((container: V1Container): ImageDescriptor => {
    return {
      pullPolicy: getPullPolicy(container),
      repository: getImageRepo(container),
      tag: getImageTag(container),
      hash: getImageHash(container, pod),
      pullSecret: pullSecrets.containers[container.name],
      nodes: [node.metadata.name],
      arch: node.metadata.labels['kubernetes.io/arch'],
      owner: {
        type: getResourceType(controllerObj),
        namespace: controllerObj.metadata.namespace,
        name: controllerObj.metadata.name,
      },
    }
  })
}

@Injectable()
export class K8sService implements IK8sService {
  private readonly coreClient: CoreV1Api
  private readonly appClient: AppsV1Api
  private readonly logger = new Logger(K8sService.name)

  constructor(@Inject('K8S_CONFIG') kubeConfig: KubeConfig) {
    this.coreClient = kubeConfig.makeApiClient(CoreV1Api)
    this.appClient = kubeConfig.makeApiClient(AppsV1Api)
  }

  async getImageList(): Promise<ImageDescriptor[]> {
    this.logger.debug('Fetching images from k8s API')
    const allDeploymentsProm = this.appClient.listDeploymentForAllNamespaces()
    const allDaemonsetsProm = this.appClient.listDaemonSetForAllNamespaces()
    const allStatefulsetsProm = this.appClient.listStatefulSetForAllNamespaces()
    const all = (
      await Promise.all([
        allDeploymentsProm,
        allDaemonsetsProm,
        allStatefulsetsProm,
      ])
    )
      .concat()
      .map((obj) => obj.body.items)
      .flat()

    this.logger.debug('Have a list of images, processing it')

    // transform the mixed list of controller objs to image descriptors
    return (
      await Promise.all(
        all.map((controllObj) =>
          getImageDescriptors(controllObj, this.coreClient)
        )
      )
    )
      .flat()
      .filter((obj) => obj != null && obj.pullPolicy === 'Always')
  }

  async triggerRollingUpdate(resource: Resource): Promise<void> {
    // looking at kubectl implementation, it just updates an annotation `kubectl.kubernetes.io/restartedAt: RFC3339`
    // lets not re-use that key but do the same thing so
    // `patchwork/restartedAt: RFC3339`
    // send a patch obj to the API
    const patches = [
      {
        op: 'replace',
        path: '/spec/template/metadata/annotations',
        value: {
          'patchwork/restartedAt': new Date().toISOString(),
        },
      },
    ]
    const reqOptions = {
      headers: { 'Content-type': PatchUtils.PATCH_FORMAT_JSON_PATCH },
    }
    switch (resource.type) {
      case ResourceType.DAEMONSET:
        await this.appClient.patchNamespacedDaemonSet(
          resource.name,
          resource.namespace,
          patches,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          reqOptions
        )
        break
      case ResourceType.DEPLOYMENT:
        await this.appClient.patchNamespacedDeployment(
          resource.name,
          resource.namespace,
          patches,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          reqOptions
        )
        break
      case ResourceType.STATEFULSET:
        await this.appClient.patchNamespacedStatefulSet(
          resource.name,
          resource.namespace,
          patches,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          reqOptions
        )
        break
    }
    this.logger.warn(
      'Rollout requested for %s in namespace %s',
      resource.name,
      resource.namespace
    )
  }

  async getPullSecretCredentials(
    descriptor: ImageDescriptor
  ): Promise<PullCredentials> {
    const secret = await this.coreClient.readNamespacedSecret(
      descriptor.pullSecret,
      descriptor.owner.namespace
    )
    const dockerConfig = JSON.parse(
      Buffer.from(secret.body.data['.dockerconfigjson'], 'base64').toString(
        'utf-8'
      )
    )
    const registries = Object.keys(dockerConfig.auths)
    for (const registry of registries) {
      const parsedDomain = parse(registry)
      if (descriptor.repository.indexOf(parsedDomain.domain) !== -1) {
        return dockerConfig.auths[registry]
      }
    }
    return null
  }
}
