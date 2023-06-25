import { Test, TestingModule } from '@nestjs/testing'
import { K8sService, ResourceType } from './k8s.service'
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

  it('should provide pull secret in descriptor when defind in pod', async () => {
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
            metadata: {
              namespace: 'test-namespace',
              name: 'test-pod',
            },
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
              imagePullSecrets: [
                {
                  name: 'regcred',
                },
              ],
              nodeName: 'TEST-NODE',
              containers: [
                {
                  name: 'test1',
                  image: 'docker.io/busybox:latest',
                  imagePullPolicy: 'Always',
                },
                {
                  name: 'test2',
                  image: 'docker.io/alpine:latest',
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
    when(mockCore.readNamespacedSecret(anything(), anything())).thenResolve({
      response: {} as unknown as any,
      body: {
        data: {
          '.dockerconfigjson': Buffer.from(
            JSON.stringify({
              auths: {
                'docker.io': {
                  username: 'test',
                  password: 'test',
                },
              },
            })
          ).toString('base64'),
        },
      },
    })

    // WHEN
    const imageList = await service.getImageList()

    expect(imageList.some((iD) => iD.pullSecret == null)).toBeFalsy()
    expect(imageList.length).toEqual(3)
  })

  it('should decompose a pull secret to provide username and password for registry', async () => {
    when(mockCore.readNamespacedSecret(anything(), anything())).thenResolve({
      response: {} as unknown as any,
      body: {
        data: {
          '.dockerconfigjson': Buffer.from(
            JSON.stringify({
              auths: {
                'docker.io': {
                  username: 'test',
                  password: 'test',
                },
              },
            })
          ).toString('base64'),
        },
      },
    })
    const creds = await service.getPullSecretCredentials({
      repository: 'docker.io/busybox',
      tag: 'latest',
      pullPolicy: 'Always',
      hash: 'test',
      nodes: [],
      arch: 'linux/arm64',
      pullSecret: 'regcred',
      owner: {
        name: 'test',
        namespace: 'test',
        type: ResourceType.DAEMONSET,
      },
    })
    expect(creds.username).toEqual('test')
    expect(creds.password).toEqual('test')
  })

  it('should not return images without pullPolicy: always', async () => {
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
              nodeName: 'TEST-NODE-PS',
              containers: [
                {
                  name: 'test1',
                  image: 'docker.io/busybox:latest',
                  imagePullPolicy: 'Always',
                },
                {
                  name: 'test2',
                  image: 'docker.io/alpine:latest',
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
