import * as core from '@actions/core'
import {isLocked} from './islocked'

async function run(): Promise<void> {
  try {
    const kubernetesContext = core.getInput('kubernetesContext', {
      required: true
    })
    const serviceName = core.getInput('serviceName', {required: true})
    const command = core.getInput('command', {required: true})
    if (command === 'isLocked') {
      await isLocked(kubernetesContext, serviceName)
    } else {
      throw new Error(`Command "${command}" is not implemented`)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
