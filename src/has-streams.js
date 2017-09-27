import XMLWriter from './xml-writer'

const STREAMS = ['system-out', 'system-err']

export default class HasStreams extends XMLWriter {
  constructor() {
    super()
    for (const s of STREAMS) {
      this[s] = []
    }
  }

  write(writable) {
    for (const s of STREAMS) {
      const text = this[s].join('').trim()
      if (text.length) {
        this.openTag(writable, s)
        this.escape(writable, text)
        this.closeTag(writable, s)
      }
    }
  }
}

