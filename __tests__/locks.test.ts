import {setOutput, warning} from '@actions/core'
import {mocked} from 'jest-mock'
import {runKubectl} from '../src/kubectl'
import {lock, unlock, isLocked} from '../src/locks'

jest.mock('@actions/core')
jest.mock('../src/kubectl', () => {
  // Require the original module to not be mocked...
  const originalModule = jest.requireActual('../src/kubectl')

  return {
    ...originalModule,
    runKubectl: jest.fn()
  }
})

const OLD_ENV = process.env
beforeEach(() => {
  process.env = {...OLD_ENV}
  mocked(runKubectl).mockClear()
})

afterEach(() => {
  process.env = OLD_ENV
})

describe('test isLocked', () => {
  describe('canary deployments', () => {
    const isProduction = false
    test('no locked deployments, one image version', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      const calls = setOutputMock.mock.calls
      expect(calls.length).toEqual(2)
      expect(calls[0]).toEqual(['CURRENT_IMAGE_SHA', gitSha])
      expect(calls[1]).toEqual(['LOCKED', false.toString()])
    })

    test('no locked deployments, one image version, one terminating pod', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `prod.artifactor.ee/serviceName:abc234   2023-11-28T12:48:16Z
${image}   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      const calls = setOutputMock.mock.calls
      expect(calls.length).toEqual(2)
      expect(calls[0]).toEqual(['CURRENT_IMAGE_SHA', gitSha])
      expect(calls[1]).toEqual(['LOCKED', false.toString()])
    })

    test('no locked deployments, one image version cache.artifactor.ee', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
`
      const gitSha = 'abc123'
      const image = `cache.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      const calls = setOutputMock.mock.calls
      expect(calls.length).toEqual(2)
      expect(calls[0]).toEqual(['CURRENT_IMAGE_SHA', gitSha])
      expect(calls[1]).toEqual(['LOCKED', false.toString()])
    })

    test('no locked deployments, one image version multiple containers', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image},otherimage:latest   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      const calls = setOutputMock.mock.calls
      expect(calls.length).toEqual(2)
      expect(calls[0]).toEqual(['CURRENT_IMAGE_SHA', gitSha])
      expect(calls[1]).toEqual(['LOCKED', false.toString()])
    })

    test('no locked deployments, two image versions', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
prod.artifactor.ee/serviceName:567def   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      expect(setOutputMock.mock.calls.length).toBe(1)
      expect(setOutputMock).toHaveBeenCalledWith('LOCKED', true.toString())

      const warningMock = mocked(warning)
      const calls = warningMock.mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0][0]).toMatch(/More than one app image/)
    })

    test('no locked deployments, two image versions, multiple containers', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image},other:1.0.0   <none>
prod.artifactor.ee/serviceName:567def   <none>
prod.artifactor.ee/serviceName:567def,other:latest   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      expect(setOutputMock.mock.calls.length).toBe(1)
      expect(setOutputMock).toHaveBeenCalledWith('LOCKED', true.toString())

      const warningMock = mocked(warning)
      const calls = warningMock.mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0][0]).toMatch(
        /More than one app image.*Not safe to proceed/
      )
    })

    test('zero app images', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/otherthing:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      expect(setOutputMock.mock.calls.length).toBe(1)
      expect(setOutputMock).toHaveBeenCalledWith('LOCKED', true.toString())

      const warningMock = mocked(warning)
      const calls = warningMock.mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0][0]).toMatch(/Zero app image revisions.*aborting/)
    })

    test('no deployments', async () => {
      const deploymentsStdout = '\n'
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return ''
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      expect(setOutputMock.mock.calls.length).toBe(1)
      expect(setOutputMock).toHaveBeenCalledWith('LOCKED', true.toString())

      const warningMock = mocked(warning)
      expect(warningMock.mock.calls.length).toBe(0)
    })

    test('multiple deployments, one prod image', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
true
<none>
true
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      const calls = setOutputMock.mock.calls
      expect(calls.length).toBe(2)
      expect(calls[0]).toEqual(['CURRENT_IMAGE_SHA', gitSha])
      expect(calls[1]).toEqual(['LOCKED', true.toString()])

      const warningMock = mocked(warning)
      expect(warningMock.mock.calls.length).toBe(0)
    })

    test('multiple deployments, multiple prod images', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
true
<none>
true
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
prod.artifactor.ee/serviceName:def678   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      const calls = setOutputMock.mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0]).toEqual(['LOCKED', true.toString()])

      const warningMock = mocked(warning)
      expect(warningMock.mock.calls.length).toBe(0)
    })

    test('multiple deployments, multiple prod images, multiple images', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
true
<none>
true
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
otherthing:latest,prod.artifactor.ee/serviceName:def678   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      const calls = setOutputMock.mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0]).toEqual(['LOCKED', true.toString()])

      const warningMock = mocked(warning)
      expect(warningMock.mock.calls.length).toBe(0)
    })

    test('multiple deployments, multiple prod images, multiple containers', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
true
<none>
true
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
prod.artifactor.ee/serviceName:def678,otherthing:latest   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      const calls = setOutputMock.mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0]).toEqual(['LOCKED', true.toString()])

      const warningMock = mocked(warning)
      expect(warningMock.mock.calls.length).toBe(0)
    })
  })

  describe('production deployments', () => {
    const isProduction = true

    test('no deployments (new namespace)', async () => {
      const deploymentsStdout = ''
      const podsStdout = ''
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      expect(setOutputMock.mock.calls.length).toBe(1)
      expect(setOutputMock).toHaveBeenCalledWith('LOCKED', false.toString())

      const warningMock = mocked(warning)
      const calls = warningMock.mock.calls
      expect(calls.length).toBe(0)
    })

    test('no locked deployments, two image versions, multiple containers', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/serviceName:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image},other:1.0.0   <none>
prod.artifactor.ee/serviceName:567def   <none>
prod.artifactor.ee/serviceName:567def,other:latest   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      expect(setOutputMock.mock.calls.length).toBe(1)
      expect(setOutputMock).toHaveBeenCalledWith('LOCKED', false.toString())

      const warningMock = mocked(warning)
      const calls = warningMock.mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0][0]).toMatch(/More than one app image.*running\.$/)
    })

    test('zero app images', async () => {
      const deploymentsStdout = `<none>
<none>
<none>
`
      const gitSha = 'abc123'
      const image = `prod.artifactor.ee/otherthing:${gitSha}`
      const podsStdout = `${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
${image}   <none>
`
      const runKubectlMock = mocked(runKubectl)
      runKubectlMock.mockImplementation(
        async (_: string, command: string[]) => {
          const baseCommand = command.slice(0, 2).join(' ')
          if (baseCommand === 'get deployments') {
            return deploymentsStdout
          } else if (baseCommand === 'get pods') {
            return podsStdout
          }
          throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
        }
      )

      await isLocked('context', 'serviceName', isProduction)

      const setOutputMock = mocked(setOutput)
      expect(setOutputMock.mock.calls.length).toBe(1)
      expect(setOutputMock).toHaveBeenCalledWith('LOCKED', false.toString())

      const warningMock = mocked(warning)
      const calls = warningMock.mock.calls
      expect(calls.length).toBe(1)
      expect(calls[0][0]).toMatch(/Zero app image revisions.*running\.$/)
    })
  })
})

describe('lock', () => {
  test('runs kubectl', async () => {
    const context = 'context'
    const service = 'service'
    const user = 'user'

    const runKubectlMock = mocked(runKubectl)
    // The mocks in other tests seem to be global?!?
    runKubectlMock.mockImplementation(
      async (c: string, cmd: string[]) => 'output'
    )

    await lock(context, service, user)

    expect(runKubectlMock).toHaveBeenCalledWith(context, [
      'label',
      'deployments',
      '--all',
      '--overwrite=true',
      `deploy-lock=${user}`
    ])
  })
})

describe('unlock', () => {
  test('runs kubectl', async () => {
    const context = 'context'
    const service = 'service'

    const runKubectlMock = mocked(runKubectl)
    // The mocks in other tests seem to be global?!?
    runKubectlMock.mockImplementation(
      async (c: string, cmd: string[]) => 'output'
    )

    await unlock(context, service)

    expect(runKubectlMock).toHaveBeenCalledWith(context, [
      'label',
      'deployments',
      '--all',
      'deploy-lock-'
    ])
  })
})
