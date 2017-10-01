/* eslint-disable
 no-param-reassign,
 */

import fs from 'fs'
import mkdirp from 'mkdirp'
import Mocha from 'mocha'
import path from 'path'
import patchRunnable from './mocha/stream-patch-runnable'
import { writeTest } from './test'
import { writeTestsuite } from './testsuite'
import { xmlDecl } from './xml-writer'

const { REPORT_FILE } = process.env

export function errorStack(err) {
  return err && err.stack ? err.stack.replace(/^/gm, '  ') : ''
}

export function errorMessage(err) {
  return err && err.message ? err.message : 'unknown error'
}

const consumeStream = patchRunnable(Mocha.Test, Mocha.Hook)

function copyStreams(test) {
  test.stdout = consumeStream('stdout')
  test.stderr = consumeStream('stderr')
}

function patchRunner(Runner) {
  const oldRun = Runner.prototype.run

  Runner.prototype.run = function runWithJunit(fn) {
    const name = REPORT_FILE
      ? path.basename(REPORT_FILE, path.extname(REPORT_FILE)).replace(/\//g, '.')
      : 'junit report'
    const startDate = new Date()
    const tests = []

    function _test(test) {
      if (!tests.includes(test)) {
        tests.push(test)
        if (!test.failures) test.failures = []
      }
      return test
    }

    this.on('test', (test) => {
      // _test(test)
    })

    this.on('fail', (failed, err) => {
      const message = errorMessage(err)
      const content = errorStack(err)

      const failing = _test(failed)
      failing.failures.push({ message, content })
    })

    this.on('test end', (test) => {
      copyStreams(test)
      _test(test)
    })

    this.on('hook end', (hook) => {
      copyStreams(hook)
    })

    this.on('suite end', (suite) => {
      // ensure all tests of suite are recorded
      // (if they are not executed by mocha, they aren't traced otherwise)
      suite.eachTest(_test)
    })

    oldRun.call(this, (result) => {
      if (REPORT_FILE) {
        // Create directory if it doesn't exist
        mkdirp(path.dirname(REPORT_FILE), (err) => {
          if (err) {
            console.error(err)
            fn(result)
            return
          }
          const failures = tests.filter(test => test.failures.length).length
          const skipped = tests.filter(test => !test.failures.length && test.isPending()).length

          const writable = fs.createWriteStream(REPORT_FILE)
          xmlDecl(writable)
          writeTestsuite(writable, name, startDate, tests.length, failures, skipped, () => {
            for (const test of tests) {
              writeTest(writable, test, test.failures, name, test.stdout, test.stderr)
            }
          })
          writable.end((_err) => {
            if (_err) {
              console.error(_err)
              fn(result)
              return
            }
            fn(0)
          })
        })
      } else {
        fn(result)
      }
    })
  }
}

patchRunner(Mocha.Runner)

