import captureStream from './capture-streams'

export default function captureStreams(runner) {
  const buffer = {
    stdout: [],
    stderr: [],
  }

  let release = null
  let test = null
  let hook = null

  function flushStream(stream) {
    const content = buffer[stream].join('')
    buffer[stream].length = 0
    const target = hook || test
    if (!target) return
    if (!target[stream]) {
      target[stream] = content
    } else {
      target[stream] += content
    }
  }

  function flushStreams() {
    flushStream('stdout')
    flushStream('stderr')
  }

  runner.on('start', () => {
    release = [
      captureStream(process.stdout, buffer.stdout),
      captureStream(process.stderr, buffer.stderr),
    ]
  })

  runner.on('end', () => {
    release.forEach((releaseFn) => { releaseFn() })
  })

  runner.on('test', (_test) => {
    flushStreams()
    test = _test
  })

  runner.on('hook', (_hook) => {
    flushStreams()
    hook = _hook
  })

  runner.on('test end', () => {
    flushStreams()
    test = null
  })

  runner.on('hook end', () => {
    flushStreams()
    hook = null
  })
}
