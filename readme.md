This Module can be loaded via `mocha --require`.
It is only activated if process.env.REPORT_FILE is set.
If activated, it:
- writes a junit-compatible xml-report to the file denoted in process.env.REPORT_FILE
- captures all stdout/stderr from tests and redirects them to this report
- sets mocha exit code to zero, if test results are written successful
