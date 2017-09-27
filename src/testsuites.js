import XMLWriter from './xml-writer'

export default class Testsuites extends XMLWriter {
  constructor(name) {
    super()
    this.name = name
    this.suites = []
  }

  write(writable) {
    this.openTag(writable, 'testsuites', { name: this.name })
    for (const testsuite of this.suites) {
      testsuite.write(writable)
    }
    return this.closeTag(writable, 'testsuites')
  }
}
