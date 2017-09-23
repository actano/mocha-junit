import { expect } from 'chai'
import { fork } from 'child_process'
import fs from 'fs'
import { before, describe, it } from 'mocha'
import path from 'path'
import rimraf from 'rimraf'

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

    before('run mocha', async () => {
      await rm(PREFIX)
      process = await execute('test/fixture/success')
      result = await readFile(path.join(PREFIX, REPORT_FILE))
    })

    it('should exit with zero', () => {
      const { code } = process
      expect(code).to.eq(0)
    })

    it('should write result file', async () => {
      expect(result).to.not.eq('')
    })

    it('should capture stdout from tests')
    it('should capture stderr from tests')
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
