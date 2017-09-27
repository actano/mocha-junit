/* eslint-disable class-methods-use-this */
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

function buildEscapes() {
  const escapes = {
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;',
  }

  const regex = new RegExp(`[${Object.keys(escapes).join('')}\\x00-\\x1f]`, 'g')
  for (let i = 0; i < 32; i += 1) {
    escapes[String.fromCharCode(i)] = `&#x${i.toString(16)};`
  }
  escapes['\t'] = '\t'
  escapes['\r'] = '\r'
  escapes['\n'] = '\n'
  return str => String(str).replace(regex, x => escapes[x])
}

const _xmlEscape = buildEscapes()

export default class XMLWriter {
  _startTag(writable, name, attrs = {}) {
    writable.write(`<${name}`)
    for (const k of Object.keys(attrs)) {
      const v = attrs[k]
      if (v != null) {
        writable.write(` ${k}="`)
        this.escape(writable, v)
        writable.write('"')
      }
    }

    return writable
  }

  openTag(writable, name, attrs) {
    return this._startTag(writable, name, attrs).write('>\n')
  }

  emptyTag(writable, name, attrs) {
    return this._startTag(writable, name, attrs).write('/>\n')
  }

  closeTag(writable, name) {
    return writable.write(`</${name}>\n`)
  }

  escape(writable, s) {
    return writable.write(_xmlEscape(s))
  }

  writeFile(output, cb) {
    // Create directory if it doesn't exist
    return mkdirp(path.dirname(output), (err) => {
      if (err != null) { return cb(err) }
      const writable = fs.createWriteStream(output)
      writable.write('<?xml version="1.1"?>\n')
      this.write(writable)
      return writable.end(cb)
    })
  }
}
