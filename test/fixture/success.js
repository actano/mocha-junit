import { describe, it } from 'mocha'
import addAttachment from '../../src/attachments'

describe('describe success', () => {
  it('success', () => {
    process.stdout.write('stdout')
    process.stderr.write('stderr')
  })
  it('attachment', function test() {
    addAttachment(this.test, 'attachment.dat')
  })
  it('skipped')
})
