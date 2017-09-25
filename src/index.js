/* eslint-disable
 no-param-reassign,
 */

import Mocha from 'mocha'
import path from 'path'
import { Test, Testsuite } from './junit-results'

const { REPORT_FILE } = process.env

function captureStream(test, name, stream) {
  const oldWrite = stream.write
  const buf = test[name]
  stream.write = function streamWrite(chunk, encoding, cb) {
    // param encoding could be ommitted
    if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }

    buf.push(chunk.toString())

    // call the original function to get output also on stdout/stderr of the process as usual
    oldWrite.call(stream, chunk, encoding, (...args) => {
      // call callback if callback is given
      if (typeof cb === 'function') {
        cb(...args)
      }
    })
  }

  stream.write._old = oldWrite
}

function releaseStream(stream) {
  if (stream.write._old == null) {
    return
  }
  stream.write = stream.write._old
}

function captureStreams(test) {
  captureStream(test, 'system-out', process.stdout)
  captureStream(test, 'system-err', process.stderr)
}

function releaseStreams() {
  releaseStream(process.stdout)
  releaseStream(process.stderr)
}

const withReleaseStreams = fn => (...args) => {
  releaseStreams()
  fn(...args)
}

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

      this.on('start', () => {
        testsuite = new Testsuite(name)
      })

      this.on('end', () => {
        testsuite.end()
      })

      this.on('test', (test) => {
        test._junitCaptureTest = _test(test)
      })

      this.on('fail', (failed, err) => {
        let test = failed
        if (failed.type !== 'test') {
          nonTestFailed = true
          testsuite.failures += 1
          test = (failed.ctx && failed.ctx.currentTest) || failed
        }
        _test(test).fail(failed, err)
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
      super.run(() => {
        suite.eachTest(test => _test(test))

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
