import {setOutput, warning} from '@actions/core'
import {mocked} from 'ts-jest/utils'
import {runKubectl} from '../src/kubectl'
import {isLocked} from '../src/locks'

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
})

afterEach(() => {
  process.env = OLD_ENV
})

describe('test isLocked', () => {
  test('no locked deployments, one image version', async () => {
    const deploymentsStdout = `<none>
<none>
<none>
`
    const gitSha = 'abc123'
    const image = `prod.smartly.af/serviceName:${gitSha}`
    const podsStdout = `${image}
${image}
${image}
${image}
${image}
${image}
${image}
${image}
${image}
`
    const runKubectlMock = mocked(runKubectl)
    runKubectlMock.mockImplementation(async (_: string, command: string[]) => {
      const baseCommand = command.slice(0, 2).join(' ')
      if (baseCommand === 'get deployments') {
        return deploymentsStdout
      } else if (baseCommand === 'get pods') {
        return podsStdout
      }
      throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
    })

    await isLocked('context', 'serviceName')

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
    const image = `prod.smartly.af/serviceName:${gitSha}`
    const podsStdout = `${image}
${image}
${image}
${image}
${image}
${image}
${image}
${image}
${image}
prod.smartly.af/serviceName:567def
`
    const runKubectlMock = mocked(runKubectl)
    runKubectlMock.mockImplementation(async (_: string, command: string[]) => {
      const baseCommand = command.slice(0, 2).join(' ')
      if (baseCommand === 'get deployments') {
        return deploymentsStdout
      } else if (baseCommand === 'get pods') {
        return podsStdout
      }
      throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
    })

    await isLocked('context', 'serviceName')

    const setOutputMock = mocked(setOutput)
    expect(setOutputMock.mock.calls.length).toBe(1)
    expect(setOutputMock).toHaveBeenCalledWith('LOCKED', true.toString())

    const warningMock = mocked(warning)
    const calls = warningMock.mock.calls
    expect(calls.length).toBe(1)
    expect(calls[0][0]).toMatch(/More than one app image/)
  })

  test('zero app images', async () => {
    const deploymentsStdout = `<none>
<none>
<none>
`
    const gitSha = 'abc123'
    const image = `prod.smartly.af/otherthing:${gitSha}`
    const podsStdout = `${image}
${image}
${image}
${image}
${image}
${image}
${image}
${image}
${image}
`
    const runKubectlMock = mocked(runKubectl)
    runKubectlMock.mockImplementation(async (_: string, command: string[]) => {
      const baseCommand = command.slice(0, 2).join(' ')
      if (baseCommand === 'get deployments') {
        return deploymentsStdout
      } else if (baseCommand === 'get pods') {
        return podsStdout
      }
      throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
    })

    await isLocked('context', 'serviceName')

    const setOutputMock = mocked(setOutput)
    expect(setOutputMock.mock.calls.length).toBe(1)
    expect(setOutputMock).toHaveBeenCalledWith('LOCKED', true.toString())

    const warningMock = mocked(warning)
    const calls = warningMock.mock.calls
    expect(calls.length).toBe(1)
    expect(calls[0][0]).toMatch(/Zero app image revisions/)
  })

  test('no deployments', async () => {
    const deploymentsStdout = '\n'
    const runKubectlMock = mocked(runKubectl)
    runKubectlMock.mockImplementation(async (_: string, command: string[]) => {
      const baseCommand = command.slice(0, 2).join(' ')
      if (baseCommand === 'get deployments') {
        return deploymentsStdout
      }
      throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
    })

    await isLocked('context', 'serviceName')

    const setOutputMock = mocked(setOutput)
    expect(setOutputMock.mock.calls.length).toBe(1)
    expect(setOutputMock).toHaveBeenCalledWith('LOCKED', true.toString())

    const warningMock = mocked(warning)
    expect(warningMock.mock.calls.length).toBe(0)
  })

  test('multiple deployments', async () => {
    const deploymentsStdout = `<none>
<none>
<none>
true
<none>
true
<none>
`
    const runKubectlMock = mocked(runKubectl)
    runKubectlMock.mockImplementation(async (_: string, command: string[]) => {
      const baseCommand = command.slice(0, 2).join(' ')
      if (baseCommand === 'get deployments') {
        return deploymentsStdout
      }
      throw new Error(`Unhandled command in test: "${command.join(' ')}"`)
    })

    await isLocked('context', 'serviceName')

    const setOutputMock = mocked(setOutput)
    expect(setOutputMock.mock.calls.length).toBe(1)
    expect(setOutputMock).toHaveBeenCalledWith('LOCKED', true.toString())

    const warningMock = mocked(warning)
    expect(warningMock.mock.calls.length).toBe(0)
  })
})
