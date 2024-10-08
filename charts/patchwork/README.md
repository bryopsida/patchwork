# patchwork

![Version: 0.8.6](https://img.shields.io/badge/Version-0.8.6-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.4.0](https://img.shields.io/badge/AppVersion-0.4.0-informational?style=flat-square)

Watches deployments, daemonsets, and statefulsets for image updates and will automatically trigger rollouts to pull in updates

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| bryopsida |  |  |

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| https://bryopsida.github.io/psa-restricted-patcher/ | psa-patcher(psa-restricted-patcher) | 0.10.1 |
| https://groundhog2k.github.io/helm-charts/ | redis | 0.7.5 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| autoscaling.enabled | bool | `false` |  |
| autoscaling.maxReplicas | int | `100` |  |
| autoscaling.minReplicas | int | `1` |  |
| autoscaling.targetCPUUtilizationPercentage | int | `80` |  |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"Always"` |  |
| image.repository | string | `"ghcr.io/bryopsida/patchwork"` |  |
| image.tag | string | `"main"` |  |
| imagePullSecrets | list | `[]` |  |
| ingress.annotations | object | `{}` |  |
| ingress.className | string | `""` |  |
| ingress.enabled | bool | `false` |  |
| ingress.hosts[0].host | string | `"chart-example.local"` |  |
| ingress.hosts[0].paths[0].path | string | `"/"` |  |
| ingress.hosts[0].paths[0].pathType | string | `"ImplementationSpecific"` |  |
| ingress.tls | list | `[]` |  |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podAnnotations | object | `{}` |  |
| podSecurityContext.fsGroup | int | `1001` |  |
| podSecurityContext.seccompProfile.type | string | `"RuntimeDefault"` |  |
| psa-patcher | object | `{"enabled":false}` | control the psa-restricted-patcher behavior, disabled by default, for more information see: https://artifacthub.io/packages/helm/psa-restricted-patcher/psa-restricted-patcher |
| psa-patcher.enabled | bool | `false` | enable the psa patcher |
| rbac.create | string | `"truewq"` |  |
| redis.image.pullPolicy | string | `"Always"` |  |
| redis.image.registry | string | `"ghcr.io"` |  |
| redis.image.repository | string | `"bryopsida/redis"` |  |
| redis.image.tag | string | `"main"` |  |
| replicaCount | int | `1` |  |
| resources.limits.cpu | string | `"500m"` |  |
| resources.limits.memory | string | `"256Mi"` |  |
| resources.requests.cpu | string | `"250m"` |  |
| resources.requests.memory | string | `"256Mi"` |  |
| securityContext.allowPrivilegeEscalation | bool | `false` |  |
| securityContext.capabilities.drop[0] | string | `"ALL"` |  |
| securityContext.privileged | bool | `false` |  |
| securityContext.readOnlyRootFilesystem | bool | `true` |  |
| securityContext.runAsNonRoot | bool | `true` |  |
| securityContext.runAsUser | int | `1001` |  |
| service.port | int | `3000` |  |
| service.type | string | `"ClusterIP"` |  |
| serviceAccount.annotations | object | `{}` |  |
| serviceAccount.create | bool | `true` |  |
| serviceAccount.name | string | `""` |  |
| tolerations | list | `[]` |  |
| updateCron | string | `"*/30 * * * *"` |  |
| updateGracePeriod | int | `3600` |  |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
