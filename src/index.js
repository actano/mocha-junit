/* eslint-disable
 no-param-reassign,
 */

import fs from 'fs'
import mkdirp from 'mkdirp'
import Mocha from 'mocha'
import path from 'path'
import { captureStream } from './streams'
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

function patchRunner(Runner) {
  const oldRun = Runner.prototype.run

  Runner.prototype.run = function runWithJunit(fn) {
    const name = REPORT_FILE
      ? path.basename(REPORT_FILE, path.extname(REPORT_FILE)).replace(/\//g, '.')
      : 'junit report'
    const startDate = new Date()
    const tests = []
    const buffer = {
      stdout: [],
      stderr: [],
    }
    const release = [
      captureStream(process.stdout, buffer.stdout),
      captureStream(process.stderr, buffer.stderr),
    ]

    let test = null
    let hook = null

    function flushStream(stream) {
      const content = buffer[stream].join('')
      buffer[stream].length = 0
      const target = hook || test
      if (!target) return
      if (!target[stream]) {
        target[stream] = content
      } else {
        target[stream] += content
      }
    }

    function flushStreams() {
      flushStream('stdout')
      flushStream('stderr')
    }

    function recordTest(_test) {
      if (!tests.includes(_test)) {
        tests.push(_test)
        if (!_test.failures) _test.failures = []
      }
      return _test
    }

    this.on('test', (_test) => {
      flushStreams()
      test = _test
    })

    this.on('hook', (_hook) => {
      flushStreams()
      hook = _hook
    })

    this.on('fail', (failed, err) => {
      const message = errorMessage(err)
      const content = errorStack(err)

      const failing = recordTest(failed)
      failing.failures.push({ message, content })
    })

    this.on('test end', (_test) => {
      flushStreams()
      test = null
      recordTest(_test)
    })

    this.on('hook end', () => {
      flushStreams()
      hook = null
    })

    this.on('suite end', (suite) => {
      // ensure all tests of suite are recorded
      // (if they are not executed by mocha, they aren't traced otherwise)
      suite.eachTest(recordTest)
    })

    oldRun.call(this, (result) => {
      release.forEach((releaseFn) => { releaseFn() })
      if (REPORT_FILE) {
        // Create directory if it doesn't exist
        mkdirp(path.dirname(REPORT_FILE), (err) => {
          if (err) {
            console.error(err)
            fn(result)
            return
          }
          const failures = tests.filter(_test => _test.failures.length).length
          const skipped = tests.filter(_test => !_test.failures.length && _test.isPending()).length

          const writable = fs.createWriteStream(REPORT_FILE)
          xmlDecl(writable)
          writeTestsuite(writable, name, startDate, tests.length, failures, skipped, () => {
            for (const _test of tests) {
              writeTest(writable, _test, _test.failures, name, _test.stdout, _test.stderr)
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

