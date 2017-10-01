import { closeTag, openTag, text } from './xml-writer'

const writeStream = (writable, s, value) => {
  if (value != null && value.length) {
    openTag(writable, s)
    text(writable, value)
    closeTag(writable, s)
  }
}

export const writeSystemOut = (writable, value) => {
  writeStream(writable, 'system-out', value)
}

export const writeSystemErr = (writable, value) => {
  writeStream(writable, 'system-err', value)
}
