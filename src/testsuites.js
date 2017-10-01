import { closeTag, openTag } from './xml-writer'

export default class Testsuites {
  constructor(name) {
    this.name = name
    this.suites = []
  }

  write(writable) {
    openTag(writable, 'testsuites', { name: this.name })
    for (const testsuite of this.suites) {
      testsuite.write(writable)
    }
    closeTag(writable, 'testsuites')
  }
}
