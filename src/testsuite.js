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

export function writeTestsuite(writable, name, startDate, tests, failures, skipped, fn) {
  openTag(writable, 'testsuite', {
    name,
    hostname: os.hostname(),
    timestamp: startDate.toUTCString(),
    time: (new Date() - startDate) / 1000,
    tests,
    failures,
    skipped,
    errors: 0,
  })
  fn()
  closeTag(writable, 'testsuite')
}
