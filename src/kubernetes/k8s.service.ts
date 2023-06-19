import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  AppsV1Api,
  CoreV1Api,
  KubeConfig,
  V1Container,
  V1DaemonSet,
  V1Deployment,
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
    const all = await Promise.all([
      allDeploymentsProm,
      allDaemonsetsProm,
      allStatefulsetsProm,
    ])
    const allDeployments = all[0]
    const allDaemonsets = all[1]
    const allStatefulsets = all[2]
    this.logger.log('Have a list of images, processing it')
    return allDeployments.body.items
      .map((deployment: V1Deployment): ImageDescriptor[] => {
        return deployment.spec.template.spec.containers.map(
          (cont: V1Container): ImageDescriptor => {
            return {
              repository: cont.image.split(':')[0],
              tag: cont.image.split(':')[1],
              hash: 'TBD',
              owner: {
                type: ResourceType.DEPLOYMENT,
                name: deployment.metadata.name,
                namespace: deployment.metadata.namespace,
              },
            }
          }
        )
      })
      .concat(
        allDaemonsets.body.items.map(
          (daemonset: V1DaemonSet): ImageDescriptor[] => {
            return daemonset.spec.template.spec.containers.map(
              (cont: V1Container): ImageDescriptor => {
                return {
                  repository: cont.image.split(':')[0],
                  tag: cont.image.split(':')[1],
                  hash: 'TBD',
                  owner: {
                    type: ResourceType.DAEMONSET,
                    name: daemonset.metadata.name,
                    namespace: daemonset.metadata.namespace,
                  },
                }
              }
            )
          }
        )
      )
      .concat(
        allStatefulsets.body.items.map(
          (statefulset: V1StatefulSet): ImageDescriptor[] => {
            return statefulset.spec.template.spec.containers.map(
              (cont: V1Container): ImageDescriptor => {
                return {
                  repository: cont.image.split(':')[0],
                  tag: cont.image.split(':')[1],
                  hash: 'TBD',
                  owner: {
                    type: ResourceType.STATEFULSET,
                    name: statefulset.metadata.name,
                    namespace: statefulset.metadata.namespace,
                  },
                }
              }
            )
          }
        )
      )
      .flat()
  }
}
