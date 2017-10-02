/* eslint-disable no-console */
import Mocha from 'mocha'
import createRunWithJunit from './lib/runner-run'

Mocha.Runner.prototype.run = createRunWithJunit(Mocha.Runner.prototype.run)
