import { Module } from '@nestjs/common'
import { K8sService } from './k8s.service'
import { KubeConfig } from '@kubernetes/client-node'

const kc = new KubeConfig()
kc.loadFromDefault()

@Module({
  exports: [
    {
      provide: 'K8S_SERVICE',
      useClass: K8sService,
    },
  ],
  providers: [
    {
      provide: 'K8S_SERVICE',
      useClass: K8sService,
    },
    {
      provide: 'K8S_CONFIG',
      useValue: kc,
    },
  ],
})
export class KubernetesModule {}
