import { closeTag, openTag, text } from './xml-writer'

const STREAMS = ['system-out', 'system-err']

export default class HasStreams {
  constructor() {
    for (const s of STREAMS) {
      this[s] = []
    }
  }

  write(writable) {
    for (const s of STREAMS) {
      const value = this[s].join('').trim()
      if (value.length) {
        openTag(writable, s)
        text(writable, value)
        closeTag(writable, s)
      }
    }
  }
}

