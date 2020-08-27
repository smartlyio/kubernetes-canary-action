import * as core from '@actions/core'
import {lock, unlock, isLocked} from './locks'

async function run(): Promise<void> {
  try {
    const kubernetesContext = core.getInput('kubernetesContext', {
      required: true
    })
    const serviceName = core.getInput('serviceName', {required: true})
    const command = core.getInput('command', {required: true})
    const user = core.getInput('user') || 'unknown'
    if (command === 'isLocked') {
      await isLocked(kubernetesContext, serviceName)
    } else if (command === 'lock') {
      await lock(kubernetesContext, serviceName, user)
    } else if (command === 'unlock') {
      await unlock(kubernetesContext, serviceName)
    } else {
      throw new Error(`Command "${command}" is not implemented`)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
