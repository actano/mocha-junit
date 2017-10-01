import { writeSystemErr, writeSystemOut } from './has-streams'
import { closeTag, emptyTag, openTag, text } from './xml-writer'

function fullTitle(runnable) {
  const result = []
  let r = runnable
  while (r != null) {
    if (r.title !== '') { result.push(r.title) }
    r = r.parent
  }
  return result.reverse().join('.')
}

export default class Test {
  constructor(test) {
    this['system-out'] = []
    this['system-err'] = []
    this.test = test
    this.failures = []
    this.failed = false
    this.passed = false
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

  write(writable, suite) {
    const skipped = !(this.passed || this.failed)
    const attrs = {
      classname: `${suite.name}.${fullTitle(this.test.parent)}`,
      name: this.test.title,
    }
    if (!skipped) {
      attrs.time = this.test.duration / 1000
    }
    openTag(writable, 'testcase', attrs)
    for (const failure of this.failures) {
      openTag(writable, 'failure', { message: failure.message })
      text(writable, failure.content)
      closeTag(writable, 'failure')
    }
    if (skipped) {
      emptyTag(writable, 'skipped')
    }
    writeSystemOut(writable, this['system-out'].join('').trim())
    writeSystemErr(writable, this['system-err'].join('').trim())
    closeTag(writable, 'testcase')
  }
}
