/* eslint-disable no-param-reassign */
import { captureStream } from '../streams'

const STREAMS = {
  stdout: '',
  stderr: '',
}

const STREAM_NAMES = Object.keys(STREAMS)

const createRunFunction = oldRun => function runWithCapturedStreams(fn) {
  const release = {}
  for (const s of STREAM_NAMES) {
    release[s] = captureStream(process[s])
  }
  const cb = (...args) => {
    for (const s of STREAM_NAMES) {
      STREAMS[s] += release[s]()
    }
    fn(...args)
  }
  oldRun.call(this, cb)
}

export const consume = (name) => {
  const result = STREAMS[name] || ''
  if (result) {
    STREAMS[name] = ''
  }
  return result
}

export default (...Runnables) => {
  for (const Runnable of Runnables) {
    Runnable.prototype.run = createRunFunction(Runnable.prototype.run)
  }
  return consume
}

