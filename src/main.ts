import * as core from '@actions/core'
import {isLocked, lock, unlock} from './locks'

export function toBoolean(value: string): boolean {
  const regexp = new RegExp(/^(true|1|on|yes)$/i)
  return regexp.test(value.trim())
}

async function run(): Promise<void> {
  try {
    const kubernetesContext = core.getInput('kubernetesContext', {
      required: true
    })
    const serviceName = core.getInput('serviceName', {required: true})
    const command = core.getInput('command', {required: true})
    const user = core.getInput('user') || 'unknown'
    const isProduction = toBoolean(core.getInput('production'))
    if (command === 'isLocked') {
      await isLocked(kubernetesContext, serviceName, isProduction)
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
