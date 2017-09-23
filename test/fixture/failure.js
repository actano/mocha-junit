import { describe, it } from 'mocha'

describe('describe failure', () => {
  it('failure', () => {
    throw new Error('Test Error')
  })
})
