const { REPORT_FILE } = process.env
const output = REPORT_FILE || 'mocha-junit.xml'

export default output
