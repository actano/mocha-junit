/* eslint-disable no-param-reassign */

import { resolve, dirname } from 'path'
import output from './lib/output'

// https://wiki.jenkins.io/display/JENKINS/JUnit+Attachments+Plugin#JUnitAttachmentsPlugin-Byputtingthemintoaknownlocation

const addAttachment = (test, filename) => {
  const target = resolve(dirname(output), filename)
  if (!test.junitAttachments) {
    test.junitAttachments = []
  }
  test.junitAttachments.push(target)
  return target
}

export default addAttachment
