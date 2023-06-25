import { Test, TestingModule } from '@nestjs/testing'
import { K8sService } from './k8s.service'
import { AppsV1Api, CoreV1Api } from '@kubernetes/client-node'
import { mock, when, instance, anything } from 'ts-mockito'

describe('K8sService', () => {
  let service: K8sService
  let mockCore: CoreV1Api
  let mockAppApi: AppsV1Api

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        K8sService,
        {
          provide: 'K8S_CONFIG',
          useValue: {
            makeApiClient: (type: any) => {
              switch (type.name.toLowerCase()) {
                case 'corev1api':
                  mockCore = mock<CoreV1Api>()
                  return instance(mockCore)
                default:
                  mockAppApi = mock<AppsV1Api>()
                  return instance(mockAppApi)
              }
            },
          },
        },
      ],
    }).compile()

    service = module.get<K8sService>(K8sService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should not return images without pullPolicy: always', async () => {
    // GIVEN
    /*
        const allDeploymentsProm = this.appClient.listDeploymentForAllNamespaces()
    const allDaemonsetsProm = this.appClient.listDaemonSetForAllNamespaces()
    const allStatefulsetsProm = this.appClient.listStatefulSetForAllNamespaces()
    */
    when(mockAppApi.listDeploymentForAllNamespaces()).thenResolve({
      response: {} as unknown as any,
      body: {
        items: [
          {
            metadata: {
              namesace: 'TEST',
            },
            spec: {
              selector: {
                matchLabels: {
                  test: 'TEST-DEPLOYMENT',
                },
              },
            },
          },
        ],
      } as unknown as any,
    })
    when(mockAppApi.listStatefulSetForAllNamespaces()).thenResolve({
      response: {} as unknown as any,
      body: {
        items: [
          {
            metadata: {
              namespace: 'TEST',
            },
            spec: {
              selector: {
                matchLabels: {
                  test: 'TEST-DEPLOYMENT',
                },
              },
            },
          },
        ],
      } as unknown as any,
    })
    when(mockAppApi.listDaemonSetForAllNamespaces()).thenResolve({
      response: {} as unknown as any,
      body: {
        items: [
          {
            metadata: {
              namespace: 'TEST',
            },
            spec: {
              selector: {
                matchLabels: {
                  test: 'TEST-DEPLOYMENT',
                },
              },
            },
          },
        ],
      } as unknown as any,
    })
    when(
      mockCore.listNamespacedPod(
        anything(),
        anything(),
        anything(),
        anything(),
        anything(),
        anything()
      )
    ).thenResolve({
      response: {} as unknown as any,
      body: {
        items: [
          {
            status: {
              containerStatuses: [
                {
                  name: 'test1',
                  started: true,
                  imageID: 'name@TEST',
                },
                {
                  name: 'test2',
                  started: true,
                  imageID: 'name@TEST',
                },
              ],
            },
            spec: {
              nodeName: 'TEST-NODE',
              containers: [
                {
                  name: 'test1',
                  image: 'busybox:latest',
                  imagePullPolicy: 'Always',
                },
                {
                  name: 'test2',
                  image: 'alpine:latest',
                  imagePullPolicy: 'Never',
                },
              ],
            },
          },
        ] as unknown as any,
      },
    })
    when(mockCore.readNode(anything())).thenResolve({
      response: {} as unknown as any,
      body: {
        metadata: {
          name: 'TEST-NODE',
          labels: {},
        },
      } as unknown as any,
    })

    // WHEN
    const imageList = await service.getImageList()

    // THEN
    expect(
      imageList.some(
        (iD) => iD.pullPolicy === 'IfNotPresent' || iD.pullPolicy === 'Never'
      )
    ).toBeFalsy()
    expect(imageList.length).toEqual(3)
  })
})
