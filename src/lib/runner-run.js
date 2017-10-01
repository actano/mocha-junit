/* eslint-disable no-console */
import mochaStreams from './record-streams'
import recordTestsAndFailures from './record-runnables'
import writeResults from './write-junit'

export default (oldRun, output = 'mocha-junit.xml') => function runWithJunit(fn) {
  mochaStreams(this)
  const tests = recordTestsAndFailures(this)

  const startDate = new Date()
  oldRun.call(this, (result) => {
    writeResults(output, startDate, tests, (err) => {
      if (err) {
        console.error(err)
        fn(result || 1)
        return
      }
      fn(0)
    })
  })
}
