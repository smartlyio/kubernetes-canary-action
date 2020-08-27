import * as core from '@actions/core'
import {runKubectl, stringToArray, uniq} from './kubectl'

export async function isLocked(
  kubernetesContext: string,
  serviceName: string
): Promise<void> {
  const deployLocksRaw = await runKubectl(kubernetesContext, [
    'get',
    'deployments',
    '--no-headers',
    '-o',
    'custom-columns=NAME:.metadata.labels.deploy-lock'
  ])
  const deployLocks = uniq(stringToArray(deployLocksRaw))

  if (deployLocks.length === 1 && deployLocks[0] === '<none>') {
    let locked = false
    const imagesRaw = await runKubectl(kubernetesContext, [
      'get',
      'pods',
      '--selector=canary!=true',
      '--no-headers',
      '-o',
      'custom-columns="NAME:.spec.containers[*].image"'
    ])
    const imageRegex = new RegExp(`^prod.smartly.af/${serviceName}:(.*)`)
    const images = uniq(
      stringToArray(imagesRaw).filter(value => {
        return imageRegex.test(value)
      })
    )
    core.info(`Images matching query: ${images}`)
    if (images.length === 1) {
      const match = images[0].match(imageRegex)
      if (match) {
        const [, tag] = match
        core.setOutput('CURRENT_IMAGE_SHA', tag)
      } else {
        // Shouldn't ever get here; we're here because the image regex already matched some items
        throw new Error(
          `Failed to extract tag from image tag ${images[0]} with regex "${imageRegex}"`
        )
      }
    } else if (images.length === 0) {
      core.warning(
        'Zero app image revisions found to be running. This is an unexpected result, aborting canary deploy.'
      )
      locked = true
    } else {
      core.warning(
        'More than one app image revision running. Canary deploy would modify non-canary pods. Not safe to proceed.'
      )
      locked = true
    }
    core.setOutput('LOCKED', locked.toString())
  } else {
    core.setOutput('LOCKED', 'true')
  }
}

export async function lock(
  kubernetesContext: string,
  serviceName: string,
  user: string
): Promise<void> {
  await runKubectl(kubernetesContext, [
    'label',
    'deployments',
    '--all',
    '--overwrite=true',
    `deploy-lock=${user}`
  ])
  core.info(`${serviceName} deploys locked by user ${user}`)
}

export async function unlock(
  kubernetesContext: string,
  serviceName: string
): Promise<void> {
  await runKubectl(kubernetesContext, [
    'label',
    'deployments',
    '--all',
    'deploy-lock-'
  ])
  core.info(`${serviceName} deploys unlocked`)
}
