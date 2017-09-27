This Module can be loaded via `mocha --require`.
It is only activated if process.env.REPORT_FILE is set.
If activated, it:
- writes a junit-compatible xml-report to the file denoted in process.env.REPORT_FILE
- captures all stdout/stderr from tests and redirects them to this report
- sets mocha exit code to zero, if test results are written successful

# Hook Behaviour

If a Mocha hook fails, the hook is counted as *one* failure, and mocha behaves as follows:
* `before all`: all tests in the block are ignored
* `after all`: all tests have their normal results
* `before each`: the remaining tests are ignored
* `after each`: the remaining tests are ignored

To keep the number of tests constant, this behavior is changed:
* `before all`: first test in block fails with the hook failure, remaining tests are *pending*
* `after all`: last test in block fails with the hook failure
* `before each`: next test fails with the hook failure, remaining tests are *pending*
* `after each`: last test fails with the hook failure, remaining tests are *pending*
