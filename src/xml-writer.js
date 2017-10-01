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

export const xmlDecl = (stream) => {
  stream.write('<?xml version="1.1"?>\n')
}

export const text = (stream, s) => {
  stream.write(_xmlEscape(s))
}

const _startTag = (stream, name, attrs = {}) => {
  stream.write(`<${name}`)
  for (const k of Object.keys(attrs)) {
    const v = attrs[k]
    if (v != null) {
      stream.write(` ${k}="`)
      text(stream, v)
      stream.write('"')
    }
  }
}

export const openTag = (stream, name, attrs) => {
  _startTag(stream, name, attrs)
  stream.write('>\n')
}

export const emptyTag = (stream, name, attrs) => {
  _startTag(stream, name, attrs)
  stream.write('/>\n')
}

export const closeTag = (stream, name) => {
  stream.write(`</${name}>\n`)
}

export const writeFile = (output, xmlWriter, cb) => {
  // Create directory if it doesn't exist
  mkdirp(path.dirname(output), (err) => {
    if (err) {
      cb(err)
      return
    }
    const writable = fs.createWriteStream(output)
    xmlDecl(writable)
    xmlWriter.write(writable)
    writable.end(cb)
  })
}
