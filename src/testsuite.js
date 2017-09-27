import os from 'os'

import HasStreams from './has-streams'
import Testsuites from './testsuites'

export default class Testsuite extends HasStreams {
  constructor(name, parent) {
    super()
    this.name = name
    this.parent = parent
    this.tests = []
    this.failures = 0
    this.errors = 0
    this.timestamp = new Date()
    this.hostname = os.hostname()
    this.properties = {}
    if (this.parent == null) { this.parent = new Testsuites(this.name) }
    this.parent.suites.push(this)
  }

  addTest(test) {
    this.tests.push(test)
  }

  end() {
    this.time = new Date() - this.timestamp
  }

  write(writable) {
    let failures = 0
    let passed = 0
    const total = this.tests.length
    for (const test of this.tests) {
      if (test.failed) {
        failures += 1
      }
      if (test.passed) {
        passed += 1
      }
    }

    this.openTag(writable, 'testsuite', {
      name: this.name,
      hostname: this.hostname,
      timestamp: this.timestamp.toUTCString(),
      time: this.time / 1000,
      tests: total,
      failures: this.failures + failures,
      skipped: total - failures - passed,
      errors: this.errors,
    })

    const keys = Object.keys(this.properties)
    if (keys.length) {
      this.openTag(writable, 'properties')
      for (const name of keys) {
        const value = this.properties[name]
        this.emptyTag(writable, 'property', { name, value })
      }
      this.closeTag(writable, 'properties')
    }

    for (const test of this.tests) {
      test.write(writable)
    }

    super.write(writable)
    this.closeTag(writable, 'testsuite')
  }
}
