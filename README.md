# Kubernetes canary action

An action to handle kubectl output parsing for canary deploys and rollbacks.

This will be used to provide functionality like:
- Determine if a deploy is locked after canary
- Unlock a deployment
- list available rollbacks
- Roll back a deployment

## Requirements

- Requires `kubectl` to be installed and available on the `PATH`.
- Requires https://github.com/smartlyio/kubernetes-auth-action to have been run first

## Inputs

| Name | Default | Required | Description |
|------|---------|----------|-------------|
| kubernetesContext | | yes | Kubernetes context name. Usually the name of the cluster, but can be random. |
| serviceName | | yes | Name of the kubernetes service to operate on. |
| command | | yes | Canary support command to run. Currently onlyu isLocked is allowed. |

## Outputs

| Name | Description |
|------|-------------|
| CURRENT_IMAGE_SHA | Current docker image tag running in the cluster |
| LOCKED | Is deployment currently locked [true/false] |

## Example usage

```yaml
name: Is Locked
on:
  pull_request:
    branches:
      - master
  push:
    branches:
      - master

jobs:
  is_locked:
    runs-on: ubuntu-latest
    id: is_locked
    steps:
      - uses: actions/checkout@v2
      - name: Authenticate with the cluster
        env:
          KUBERNETES_AUTH_TOKEN: ${{ secrets.KUBERNETES_AUTH_TOKEN }}
        uses: smartlyio/kubernetes-auth-action@v1
        with:
          kubernetesClusterDomain: my-kubernetes-server.example.com
          kubernetesContext: kube-prod
          kubernetesNamespace: my-service-name
      - name: Check if deployment is locked
        uses: smartlyio/kubernetes-canary-action@v1
        with: 
          serviceName: test-service
          kubernetesContext: test-context
          command: isLocked
```

## Development

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:  
```bash
$ npm test

 PASS  ./index.test.js
  ✓ ...

...
```
