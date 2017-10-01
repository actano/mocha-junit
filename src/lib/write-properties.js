import { closeTag, emptyTag, openTag } from './write-xml'

export default function writeProperties(writable, properties) {
  const keys = Object.keys(properties)
  if (keys.length) {
    openTag(writable, 'properties')
    for (const name of keys) {
      const value = properties[name]
      emptyTag(writable, 'property', { name, value })
    }
    closeTag(writable, 'properties')
  }
}
