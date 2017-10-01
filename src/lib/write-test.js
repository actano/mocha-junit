import { writeSystemErr, writeSystemOut } from './write-streams'
import { closeTag, emptyTag, openTag, text } from './write-xml'

export default function writeTest(writable, classname, test, failures, stdout, stderr) {
  const skipped = !failures.length && test.isPending()
  const attrs = {
    classname,
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
