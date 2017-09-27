import HasStreams from './has-streams'

function fullTitle(runnable) {
  const result = []
  let r = runnable
  while (r != null) {
    if (r.title !== '') { result.push(r.title) }
    r = r.parent
  }
  return result.reverse().join('.')
}

export default class Test extends HasStreams {
  constructor(test, suite) {
    super()
    this.test = test
    this.failures = []
    this.failed = false
    this.passed = false
    this.suite = suite
  }

  fail(failed, err) {
    this.failed = true
    this.passed = false
    let message = err && err.message ? err.message : 'unknown error'
    if (failed !== this.test) { message += ` (from: ${fullTitle(failed)})` }
    let content = ''
    if (err && err.stack) {
      content = err.stack.replace(/^/gm, '  ')
    }
    return this.failures.push({ message, content })
  }

  pass() {
    this.passed = true
  }

  write(writable) {
    const skipped = !(this.passed || this.failed)
    const attrs = {
      classname: `${this.suite.name}.${fullTitle(this.test.parent)}`,
      name: this.test.title,
    }
    if (!skipped) {
      attrs.time = this.test.duration / 1000
    }
    this.openTag(writable, 'testcase', attrs)
    for (const failure of this.failures) {
      this.openTag(writable, 'failure', { message: failure.message })
      this.escape(writable, failure.content)
      this.closeTag(writable, 'failure')
    }
    if (skipped) {
      this.emptyTag(writable, 'skipped')
    }
    super.write(writable)
    return this.closeTag(writable, 'testcase')
  }
}
