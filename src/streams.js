/* eslint-disable
 no-param-reassign,
 */

function captureStream(test, name, stream) {
  const oldWrite = stream.write
  const buf = test[name]
  stream.write = function streamWrite(chunk, encoding, cb) {
    // param encoding could be ommitted
    if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }

    buf.push(chunk.toString())

    // call the original function to get output also on stdout/stderr of the process as usual
    oldWrite.call(stream, chunk, encoding, (...args) => {
      // call callback if callback is given
      if (typeof cb === 'function') {
        cb(...args)
      }
    })
  }

  stream.write._old = oldWrite
}

function releaseStream(stream) {
  if (stream.write._old == null) {
    return
  }
  stream.write = stream.write._old
}

export function captureStreams(test) {
  captureStream(test, 'system-out', process.stdout)
  captureStream(test, 'system-err', process.stderr)
}

export function releaseStreams() {
  releaseStream(process.stdout)
  releaseStream(process.stderr)
}

export const withReleaseStreams = fn => (...args) => {
  releaseStreams()
  fn(...args)
}

