import os from 'os'

import { closeTag, emptyTag, openTag } from './xml-writer'

export function writeProperties(writable, properties) {
  const keys = Object.keys(properties)
  if (keys.length) {
    openTag(writable, 'properties')
    for (const name of keys) {
      const value = properties[name]
      emptyTag(writable, 'property', { name, value })
    }
    closeTag(writable, 'properties')
  }
}

export function writeTestsuite(writable, name, startDate, tests, properties = {}) {
  const time = new Date() - startDate
  const total = tests.length
  const failures = tests.filter(test => test.failed).length
  const passed = tests.filter(test => test.passed).length

  openTag(writable, 'testsuite', {
    name,
    hostname: os.hostname(),
    timestamp: startDate.toUTCString(),
    time: time / 1000,
    tests: total,
    failures,
    skipped: total - failures - passed,
    errors: 0,
  })
  writeProperties(writable, properties)
  for (const test of tests) {
    test.write(writable, name)
  }
  closeTag(writable, 'testsuite')
}
