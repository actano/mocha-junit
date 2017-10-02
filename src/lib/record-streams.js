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

  runner.addListener('start', () => {
    release = [
      captureStream(process.stdout, buffer.stdout),
      captureStream(process.stderr, buffer.stderr),
    ]
  })

  runner.addListener('end', () => {
    release.forEach((releaseFn) => { releaseFn() })
  })

  runner.addListener('test', (_test) => {
    flushStreams()
    test = _test
  })

  runner.addListener('hook', (_hook) => {
    flushStreams()
    hook = _hook
  })

  const flush = (runnable) => {
    flushStreams()
    if (hook === runnable) {
      hook = null
    } else if (test === runnable) {
      test = null
    }
  }

  for (const event of ['fail', 'pass', 'pending', 'test end', 'hook end']) {
    runner.prependListener(event, flush)
  }
}
