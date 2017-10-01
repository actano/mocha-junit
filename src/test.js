import { writeSystemErr, writeSystemOut } from './has-streams'
import fullTitle from './mocha/full-title'
import { closeTag, emptyTag, openTag, text } from './xml-writer'

export default class Test {
  constructor(test) {
    this['system-out'] = []
    this['system-err'] = []
    this.test = test
    this.failures = []
  }

  isFailed() {
    return !!this.failures.length
  }

  isPassed() {
    return !this.isFailed() && !this.test.isPending()
  }

  isSkipped() {
    return !this.isFailed() && !this.isPassed()
  }

  write(writable, suiteName) {
    const skipped = this.isSkipped()
    const attrs = {
      classname: `${suiteName}.${fullTitle(this.test.parent)}`,
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
