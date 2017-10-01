/* eslint-disable
 no-param-reassign,
 */

import fs from 'fs'
import mkdirp from 'mkdirp'
import Mocha from 'mocha'
import path from 'path'
import patchRunnable from './mocha/stream-patch-runnable'
import Test from './test'
import Testsuite from './testsuite'
import { xmlDecl } from './xml-writer'

const { REPORT_FILE } = process.env

const consumeStream = patchRunnable(Mocha.Test, Mocha.Hook)

function copyStreams(test) {
  test['system-out'].push(consumeStream('stdout'))
  test['system-err'].push(consumeStream('stderr'))
}

function patchRunner(Runner) {
  const oldRun = Runner.prototype.run

  Runner.prototype.run = function runWithJunit(fn) {
    const name = REPORT_FILE
      ? path.basename(REPORT_FILE, path.extname(REPORT_FILE)).replace(/\//g, '.')
      : 'junit report'
    const testsuite = new Testsuite(name)
    const tests = []

    function _test(test) {
      if (test._junitTest == null) {
        test._junitTest = new Test(test)
        tests.push(test._junitTest)
      }
      return test._junitTest
    }

    this.on('pass', (test) => {
      _test(test).pass()
    })

    this.on('fail', (failed, err) => {
      const failing = _test(failed.ctx.currentTest || failed)
      failing.fail(failed, err)
      copyStreams(failing, failed)
    })

    this.on('test end', (test) => {
      copyStreams(_test(test), test)
    })

    this.on('hook end', (hook) => {
      // if hook is dedicated to a test copy stream output there
      if (hook.ctx.currentTest != null) {
        const test = _test(hook.ctx.currentTest)
        copyStreams(test, hook)
      }
    })

    this.on('suite end', (suite) => {
      // ensure all tests of suite are recorded
      // (if they are not executed by mocha, they aren't traced otherwise)
      suite.eachTest(_test)
    })

    oldRun.call(this, (result) => {
      testsuite.end()
      if (REPORT_FILE) {
        // Create directory if it doesn't exist
        mkdirp(path.dirname(REPORT_FILE), (err) => {
          if (err) {
            console.error(err)
            fn(result)
            return
          }
          const writable = fs.createWriteStream(REPORT_FILE)
          xmlDecl(writable)
          testsuite.write(writable, tests)
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
