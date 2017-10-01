export function errorStack(err) {
  return err && err.stack ? err.stack.replace(/^/gm, '  ') : ''
}

export function errorMessage(err) {
  return err && err.message ? err.message : 'unknown error'
}

export default function recordTestsAndFailures(runner) {
  const tests = []

  function recordTest(_test) {
    if (!tests.includes(_test)) {
      tests.push(_test)
      // eslint-disable-next-line no-param-reassign
      if (!_test.failures) _test.failures = []
    }
    return _test
  }

  runner.on('fail', (failed, err) => {
    const message = errorMessage(err)
    const content = errorStack(err)

    const failing = recordTest(failed)
    failing.failures.push({ message, content })
  })

  runner.on('test end', (_test) => {
    recordTest(_test)
  })

  runner.on('suite end', (suite) => {
    // ensure all tests of suite are recorded
    // (if they are not executed by mocha, they aren't traced otherwise)
    suite.eachTest(recordTest)
  })

  return tests
}
