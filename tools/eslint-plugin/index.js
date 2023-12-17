const path = require('path')

/**
 * @param {{cwd: string, filename: string}} context
 */
function ensureScriptsDirectory(context) {
  const relative = context.filename.replace(context.cwd, '')
  if (relative.startsWith(path.sep + 'scripts')) return true
  return false
}
exports.ensureScriptsDirectory = ensureScriptsDirectory

module.exports.rules = {
  'ensure-modules': require('./rules/ensure-modules'),
  'no-unsupported-features': require('./rules/no-unsupported'),
  'no-cycle': require('./rules/no-cycle.js'),
}
