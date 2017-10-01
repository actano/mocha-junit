/* eslint-disable
 no-param-reassign,
 */

function releaseStream(stream) {
  if (stream.write._old == null) {
    return
  }
  stream.write = stream.write._old
}

export default function captureStream(stream, buf = []) {
  const oldWrite = stream.write
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
  return () => {
    releaseStream(stream)
    return buf.join('')
  }
}

