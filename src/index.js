/* eslint-disable no-console */
import Mocha from 'mocha'
import createRunWithJunit from './lib/runner-run'

const { REPORT_FILE } = process.env

Mocha.Runner.prototype.run = createRunWithJunit(Mocha.Runner.prototype.run, REPORT_FILE)
