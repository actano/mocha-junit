import os from 'os'

import { closeTag, openTag } from './write-xml'

export default function writeTestsuite(writable, name, startDate, tests, failures, skipped, fn) {
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
