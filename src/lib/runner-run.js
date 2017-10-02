/* eslint-disable no-console */
import mochaStreams from './record-streams'
import recordTestsAndFailures from './record-runnables'
import writeResults from './write-junit'
import output from './output'

export default oldRun => function runWithJunit(fn) {
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
