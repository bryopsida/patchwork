# Patchwork

## What does this do?

This inspects your statefulsets, daemonsets, deployments and checks the associated registries to see if the tag has been updated. If an update is available it triggers a rollout on that resource. This is very early in development and should not be run in production servers.

## What are the current limitations

This is still very early in development and has a few limitations.

1. Does not support private registries
2. Does not pull updates for things without `imagePullPolicy = Always`
3. Only looks for updates to the same tag, IE for cases where base patches have been pushed to a tag

## How to deploy

First add the repo `helm repo add patchwork  https://bryopsida.github.io/patchwork/`, then fetch updates `helm repo update`, and finally, install with `helm upgrade --install patchwork patchwork/patchwork --wait`.
