export default (runnable) => {
  const result = []
  let r = runnable
  while (r != null) {
    if (r.title !== '') { result.push(r.title) }
    r = r.parent
  }
  return result.reverse().join('.')
}
