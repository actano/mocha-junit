import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import writeTest from './write-test'
import writeTestsuite from './write-testsuite'
import { xmlDecl } from './write-xml'
import fullTitle from './full-title'

export default function writeResults(output, startDate, tests, cb) {
  const name = path.basename(output, path.extname(output))

  // Create directory if it doesn't exist
  mkdirp(path.dirname(output), (err) => {
    if (err) {
      cb(err)
      return
    }
    const failures = tests.filter(test => test.failures.length).length
    const skipped = tests.filter(test => !test.failures.length && test.isPending()).length

    const writable = fs.createWriteStream(output)
    xmlDecl(writable)
    writeTestsuite(writable, name, startDate, tests.length, failures, skipped, () => {
      for (const test of tests) {
        const classname = `${name}.${fullTitle(test.parent)}`
        writeTest(writable, classname, test, test.failures, test.stdout, test.stderr)
      }
    })
    writable.end(cb)
  })
}
