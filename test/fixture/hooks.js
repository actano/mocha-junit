import { describe, it, before, after, beforeEach, afterEach } from 'mocha'

describe('hook failures', () => {
  const fail = (num = 1) => {
    let counter = 0
    return () => {
      counter += 1
      if (counter === num) throw new Error('Test Hook Exception')
    }
  }

  describe('before', () => {
    before('hook', fail())

    it('test 1', () => {})
    it('test 2', () => {})
  })

  describe('after', () => {
    after('hook', fail())

    it('test 1', () => {})
    it('test 2', () => {})
  })

  describe('beforeEach', () => {
    beforeEach('hook', fail(2))

    it('test 1', () => {})
    it('test 2', () => {})
    it('test 3', () => {})
  })

  describe('afterEach', () => {
    afterEach('hook', fail(2))

    it('test 1', () => {})
    it('test 2', () => {})
    it('test 3', () => {})
  })
})
