import { expect } from 'chai'
import { fork } from 'child_process'
import fs from 'fs'
import { before, describe, it } from 'mocha'
import path from 'path'
import rimraf from 'rimraf'
import { parseString } from 'xml2js'

const MOCHA_BIN = 'node_modules/.bin/mocha'
const SRC = 'src'
const TEMP_DIR = 'fixture-out'
const REPORT_FILE = path.join(TEMP_DIR, 'junit.xml')

const execute = (...args) => new Promise((resolve, reject) => {
  const process = fork(MOCHA_BIN, ['--require', SRC, ...args], {
    env: { REPORT_FILE },
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
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
  let process
  let result
  let parsed

  const _item = (array = [], index = 0) => array[index] || {}
  const getTestSuite = () => parsed.testsuite.$

  const _tc = index => _item(parsed.testsuite.testcase, index)
  const getTestCase = index => _tc(index).$
  const getFailure = index => _item(_tc(index).failure, 0).$
  const getStandardOut = index => _tc(index)['system-out'].join('')
  const getStandardErr = index => _tc(index)['system-err'].join('')

  const prepare = async (...args) => {
    await rm(TEMP_DIR)

    parsed = null
    result = null
    process = await execute(...args)
    try {
      result = await readFile(REPORT_FILE)
    } catch (e) {
      if (e.code === 'ENOENT') {
        return
      }
      throw e
    }
    parsed = await new Promise((resolve, reject) => {
      parseString(result, (err, _parsed) => (err ? reject(err) : resolve(_parsed)))
    })
  }

  after('remove intermediate output', async () => {
    await rm(TEMP_DIR)
  })

  describe('tests succeeding', () => {
    before('run mocha', async () => {
      await prepare('test/fixture/success')
    })

    it('should exit with zero', () => {
      const { code } = process
      expect(code).to.eq(0)
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
    before('run mocha', async () => {
      await prepare('test/fixture/failure')
    })

    it('should exit with zero', () => {
      const { code } = process
      expect(code).to.eq(0)
    })

    it('should contain number of tests failed', () => {
      const testsuite = getTestSuite()
      expect(testsuite.failures).to.eq(String(1))
    })
  })

  describe('exception in test runner', () => {
    before('run mocha', async () => {
      await prepare('test/fixture/missing')
    })

    it('should exit with non-zero', () => {
      const { code } = process
      expect(code).to.not.eq(0)
    })
  })

  describe('exception hooks', () => {
    let testsuite

    before('run mocha', async () => {
      await prepare('test/fixture/hooks')
      testsuite = getTestSuite()
    })

    it('records correct number of tests (# of tests + failing hooks)', () => {
      expect(testsuite.tests).to.eq(String(14))
    })

    it('records correct number of failures', () => {
      expect(testsuite.failures).to.eq(String(4))
    })

    it('should record hook as failing test for failing before all hook', () => {
      expect(!!getFailure(0), 'before all hook fails').to.eq(true)
    })
    it('should record hook as failing test for failing after all hook', () => {
      expect(!!getFailure(5), 'after all hook fails').to.eq(true)
    })
    it('should record hook as failing test for failing before each hook', () => {
      expect(!!getFailure(7), 'before each hook fails').to.eq(true)
    })
    it('should record hook as failing test for failing after each hook', () => {
      expect(!!getFailure(12), 'after each hook fails').to.eq(true)
    })
  })
})
