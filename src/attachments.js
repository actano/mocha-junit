/* eslint-disable no-param-reassign */

import { resolve, dirname, join } from 'path'
import output from './lib/output'

export const outputDir = resolve(dirname(output))

// https://wiki.jenkins.io/display/JENKINS/JUnit+Attachments+Plugin#JUnitAttachmentsPlugin-Byputtingthemintoaknownlocation

const addAttachment = (test, filename) => {
  const target = join(outputDir, filename)
  if (!test.junitAttachments) {
    test.junitAttachments = []
  }
  test.junitAttachments.push(target)
  return target
}

export default addAttachment
