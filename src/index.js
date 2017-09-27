/* eslint-disable
 no-param-reassign,
 */

import Mocha from 'mocha'
import path from 'path'
import Testsuite from './testsuite'
import Test from './test'
import { captureStreams, releaseStreams, withReleaseStreams } from './streams'

const { REPORT_FILE } = process.env

const install = (reportFile) => {
  const name = path.basename(reportFile, path.extname(reportFile)).replace(/\//g, '.')
  let testsuite = null
  let nonTestFailed = false

  function _test(test) {
    if (test._junitTest == null) {
      test._junitTest = new Test(test, testsuite)
      testsuite.addTest(test._junitTest)
    }
    return test._junitTest
  }

  class MyRunner extends Mocha.Runner {
    constructor(...args) {
      super(...args)
      testsuite = new Testsuite(name)

      this.on('test', (test) => {
        test._junitCaptureTest = _test(test)
      })

      this.on('fail', (failed, err) => {
        const fail = test => _test(test).fail(failed, err)
        let test = failed
        if (failed.type === 'hook') {
          if (failed.ctx.currentTest) {
            fail(failed.ctx.currentTest)
          } else if (String(failed.title).startsWith('"before all" hook')) {
            let first = null
            failed.parent.eachTest((t) => {
              if (!first) first = t
            })
            fail(first)
          } else if (String(failed.title).startsWith('"after all" hook')) {
            let last = null
            failed.parent.eachTest((t) => {
              last = t
            })
            fail(last)
          } else {
            failed.parent.eachTest(fail)
          }
        } else if (failed.type === 'test') {
          test = (failed.ctx && failed.ctx.currentTest) || failed
          fail(test)
        } else {
          nonTestFailed = true
        }
      })

      this.on('pass', (test) => {
        _test(test).pass()
      })

      this.on('hook', (hook) => {
        if (hook.ctx.currentTest != null) {
          const test = _test(hook.ctx.currentTest)
          hook._streamsCaptured = true
          captureStreams(test)
        }
      })

      this.on('hook end', (hook) => {
        if (hook._streamsCaptured) {
          delete hook._streamsCaptured
          releaseStreams()
        }
      })
    }

    run(fn) {
      console.log('Running mocha-junit, will write results to %s', reportFile)
      const suite = this.suite
      suite.eachTest(test => _test(test))
      super.run(() => {
        testsuite.end()
        testsuite.writeFile(reportFile, (err) => {
          if (err != null) {
            throw err
          }
          return fn(nonTestFailed ? 1 : 0)
        })
      })
    }

    runTest(fn) {
      const test = this.test._junitCaptureTest
      if (test != null) {
        delete this.test._junitCaptureTest
        fn = withReleaseStreams(fn)
        captureStreams(test)
      }
      super.runTest(fn)
    }
  }

  Mocha.Runner = MyRunner
}

if (REPORT_FILE) {
  install(REPORT_FILE)
}
