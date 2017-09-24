import { expect } from 'chai'
import { fork } from 'child_process'
import fs from 'fs'
import { before, describe, it } from 'mocha'
import path from 'path'
import rimraf from 'rimraf'
import { parseString } from 'xml2js'

const MOCHA_BIN = 'node_modules/.bin/mocha'
const SRC = 'src'
const REPORT_FILE = 'junit.xml'
const PREFIX = 'fixture-out'

const execute = (...args) => new Promise((resolve, reject) => {
  const process = fork(MOCHA_BIN, ['--require', SRC, ...args], {
    env: { PREFIX, REPORT_FILE },
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  })
  process.on('error', reject)
  process.on('close', (code, signal) => resolve({ code, signal }))
})

const rm = file => new Promise((resolve, reject) => {
  rimraf(file, { glob: false }, err => (err ? reject(err) : resolve()))
})

const readFile = file => new Promise((resolve, reject) => {
  fs.readFile(file, (err, data) => (err ? reject(err) : resolve(data)))
})

describe('contract from readme', () => {
  after('remove intermediate output', async () => {
    await rm(PREFIX)
  })

  describe('tests succeeding', () => {
    let process
    let result
    let parsed

    const getTestSuite = () => parsed.testsuite.$
    const getTestCase = (index = 0) => parsed.testsuite.testcase[index].$
    const getStandardOut = (index = 0) => parsed.testsuite.testcase[index]['system-out'].join('')
    const getStandardErr = (index = 0) => parsed.testsuite.testcase[index]['system-err'].join('')

    before('run mocha', async () => {
      await rm(PREFIX)
      process = await execute('test/fixture/success')
      result = await readFile(path.join(PREFIX, REPORT_FILE))
      parsed = await new Promise((resolve, reject) => {
        parseString(result, (err, _parsed) => (err ? reject(err) : resolve(_parsed)))
      })
    })

    it('should exit with zero', () => {
      const { code } = process
      expect(code).to.eq(0)
    })

    it('should write result file', () => {
      expect(result).to.not.eq('')
    })

    it('should contain a testsuite', () => {
      expect(parsed).to.have.property('testsuite')
      expect(parsed.testsuite).to.have.property('$')
    })

    describe('testsuite', () => {
      let testsuite

      before(() => {
        testsuite = getTestSuite()
      })

      it('should have a name', () => {
        expect(testsuite).to.have.property('name')
      })

      it('should contain hostname', () => {
        expect(testsuite).to.have.property('hostname')
      })

      it('should contain a timestamp', () => {
        expect(testsuite).to.have.property('timestamp')
      })

      it('should contain test time', () => {
        expect(testsuite).to.have.property('time')
      })

      it('should contain number of tests run', () => {
        expect(testsuite.tests).to.eq(String(2))
      })

      it('should contain number of tests failed', () => {
        expect(testsuite.failures).to.eq(String(0))
      })

      it('should contain number of tests skipped', () => {
        expect(testsuite.skipped).to.eq(String(1))
      })

      it('should contain number of errors', () => {
        expect(testsuite.errors).to.eq(String(0))
      })

      it('should contain a testcase', () => {
        expect(parsed.testsuite).to.have.property('testcase')
        expect(parsed.testsuite.testcase).to.be.instanceof(Array)
        expect(parsed.testsuite.testcase[0]).to.have.property('$')
      })

      describe('testcase', () => {
        let testcase

        before(() => {
          testcase = getTestCase()
        })

        it('should contain classname', () => {
          expect(testcase).to.have.property('classname')
        })

        it('should contain result', () => {
          expect(testcase).to.have.property('name')
        })

        it('should contain test time', () => {
          expect(testcase).to.have.property('time')
        })

        it('should capture stdout', () => {
          expect(parsed.testsuite.testcase[0]).to.have.property('system-out')

          const stdout = getStandardOut()
          expect(stdout).to.contain('stdout')
        })

        it('should capture stderr', () => {
          expect(parsed.testsuite.testcase[0]).to.have.property('system-err')

          const stderr = getStandardErr()
          expect(stderr).to.contain('stderr')
        })
      })
    })
  })

  describe('tests failing', () => {
    let process

    before('run mocha', async () => {
      await rm(PREFIX)
      process = await execute('test/fixture/failure')
    })

    it('should exit with zero', () => {
      const { code } = process
      expect(code).to.eq(0)
    })

    it('should write result file', async () => {
      const result = await readFile(path.join(PREFIX, REPORT_FILE))
      expect(result).to.not.eq('')
    })
  })

  describe('exception in test runner', () => {
    let process

    before('run mocha', async () => {
      await rm(PREFIX)
      process = await execute('test/fixture/missing')
    })

    it('should exit with non-zero', () => {
      const { code } = process
      expect(code).to.not.eq(0)
    })
  })
})
