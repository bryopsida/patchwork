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
} from '@kubernetes/client-node'

export enum ResourceType {
  // eslint-disable-next-line no-unused-vars
  DEPLOYMENT,
  // eslint-disable-next-line no-unused-vars
  STATEFULSET,
  // eslint-disable-next-line no-unused-vars
  DAEMONSET,
}

export interface Resource {
  type: ResourceType
  name: string
  namespace: string
}

export interface ImageDescriptor {
  repository: string
  tag: string
  hash: string
  owner: Resource
}

export interface IK8sService {
  getImageList(): Promise<Array<ImageDescriptor>>
}

function getSelector(
  controllerObj: V1StatefulSet | V1Deployment | V1DaemonSet
): V1LabelSelector {
  return controllerObj.spec.selector
}

async function getFirstPod(
  selector: V1LabelSelector,
  namespace: string,
  client: CoreV1Api
): Promise<V1Pod> {
  const resp = await client.listNamespacedPod(
    namespace,
    null,
    null,
    null,
    null,
    selector.matchLabels.app
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
  if (pod == null) return null
  return pod.spec.containers.map((container: V1Container): ImageDescriptor => {
    return {
      repository: getImageRepo(container),
      tag: getImageTag(container),
      hash: getImageHash(container, pod),
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
    this.logger.log('Fetching images from k8s API')
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

    this.logger.log('Have a list of images, processing it')

    // transform the mixed list of controller objs to image descriptors
    return (
      await Promise.all(
        all.map((controllObj) =>
          getImageDescriptors(controllObj, this.coreClient)
        )
      )
    )
      .flat()
      .filter((obj) => obj != null)
  }
}
