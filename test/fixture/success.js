import { describe, it } from 'mocha'

describe('describe success', () => {
  it('success', () => {
    process.stdout.write('stdout')
    process.stderr.write('stderr')
  })
})
