/* eslint-disable
 class-methods-use-this
 */
/*
    This Module can be loaded via `mocha --require`.
    It is only activated if process.env.REPORT_FILE is set.
    If activated, it:
    - writes a junit-compatible xml-report to the file denoted in process.env.REPORT_FILE
      (the directory of this file is prefixed with process.env.PREFIX, if set)
    - captures all stdout/stderr from tests and redirects them to this report
    - sets mocha exit code to zero, if test results are written successful
*/

import fs from 'fs'
import mkdirp from 'mkdirp'
import os from 'os'
import path from 'path'

const STREAMS = ['system-out', 'system-err']

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

class XMLWriter {
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
    },
    )
  }
}

class HasStreams extends XMLWriter {
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

class Testsuites extends XMLWriter {
  constructor(name) {
    super()
    this.name = name
    this.suites = []
  }

  write(writable) {
    this.openTag(writable, 'testsuites', { name: this.name })
    for (const testsuite of this.suites) {
      testsuite.write(writable)
    }
    return this.closeTag(writable, 'testsuites')
  }
}

class Testsuite extends HasStreams {
  constructor(name, parent) {
    super()
    this.name = name
    this.parent = parent
    this.tests = []
    this.failures = 0
    this.errors = 0
    this.timestamp = new Date()
    this.hostname = os.hostname()
    this.properties = {}
    if (this.parent == null) { this.parent = new Testsuites(this.name) }
    this.parent.suites.push(this)
  }

  addTest(test) {
    this.tests.push(test)
  }

  end() {
    this.time = new Date() - this.timestamp
  }

  write(writable) {
    let failures = 0
    let passed = 0
    const total = this.tests.length
    for (const test of this.tests) {
      if (test.failed) {
        failures += 1
      }
      if (test.passed) {
        passed += 1
      }
    }

    this.openTag(writable, 'testsuite', {
      name: this.name,
      hostname: this.hostname,
      timestamp: this.timestamp.toUTCString(),
      time: this.time / 1000,
      tests: total,
      failures: this.failures + failures,
      skipped: total - failures - passed,
      errors: this.errors,
    })

    const keys = Object.keys(this.properties)
    if (keys.length) {
      this.openTag(writable, 'properties')
      for (const name of keys) {
        const value = this.properties[name]
        this.emptyTag(writable, 'property', { name, value })
      }
      this.closeTag(writable, 'properties')
    }

    for (const test of this.tests) {
      test.write(writable)
    }

    super.write(writable)
    this.closeTag(writable, 'testsuite')
  }
}

function fullTitle(runnable) {
  const result = []
  let r = runnable
  while (r != null) {
    if (r.title !== '') { result.push(r.title) }
    r = r.parent
  }
  return result.reverse().join('.')
}

class Test extends HasStreams {
  constructor(test, suite) {
    super()
    this.test = test
    this.failures = []
    this.failed = false
    this.passed = false
    this.suite = suite
  }

  fail(failed, err) {
    this.failed = true
    this.passed = false
    let message = err && err.message ? err.message : 'unknown error'
    if (failed !== this.test) { message += ` (from: ${fullTitle(failed)})` }
    let content = ''
    if (err && err.stack) {
      content = err.stack.replace(/^/gm, '  ')
    }
    return this.failures.push({ message, content })
  }

  pass() {
    this.passed = true
  }

  write(writable) {
    const skipped = !(this.passed || this.failed)
    const attrs = {
      classname: `${this.suite.name}.${fullTitle(this.test.parent)}`,
      name: this.test.title,
    }
    if (!skipped) {
      attrs.time = this.test.duration / 1000
    }
    this.openTag(writable, 'testcase', attrs)
    for (const failure of this.failures) {
      this.openTag(writable, 'failure', { message: failure.message })
      this.escape(writable, failure.content)
      this.closeTag(writable, 'failure')
    }
    if (skipped) {
      this.emptyTag(writable, 'skipped')
    }
    super.write(writable)
    return this.closeTag(writable, 'testcase')
  }
}

export { Testsuites, Testsuite, Test }
