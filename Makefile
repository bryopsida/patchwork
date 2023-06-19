HELM_NAMESPACE ?= patchwork
HELM_RELEASE_NAME ?= patchwork
HELM_IMAGE_TAG ?= main

helmDeploy:
	helm upgrade --install --namespace=$(HELM_NAMESPACE) $(HELM_RELEASE_NAME) charts/patchwork --set image.tag=$(HELM_IMAGE_TAG) --debug --wait $(HELM_EXTRA_ARGS)
