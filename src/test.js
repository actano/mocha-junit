import { writeSystemErr, writeSystemOut } from './has-streams'
import fullTitle from './mocha/full-title'
import { closeTag, emptyTag, openTag, text } from './xml-writer'

export function writeTest(writable, test, failures, suiteName, stdout, stderr) {
  const skipped = !failures.length && test.isPending()
  const attrs = {
    classname: `${suiteName}.${fullTitle(test.parent)}`,
    name: test.title,
  }
  if (!skipped) {
    attrs.time = test.duration / 1000
  }
  openTag(writable, 'testcase', attrs)
  for (const failure of failures) {
    openTag(writable, 'failure', { message: failure.message })
    text(writable, failure.content)
    closeTag(writable, 'failure')
  }
  if (skipped) {
    emptyTag(writable, 'skipped')
  }
  writeSystemOut(writable, stdout)
  writeSystemErr(writable, stderr)
  closeTag(writable, 'testcase')
}
