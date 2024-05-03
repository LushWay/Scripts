const path = require('path')

/** @typedef {{ cwd: string; filename: string }} Context */

/** @param {Context} context */
function toRelative(context, filename = context.filename) {
  return filename.replace(context.cwd, '').replaceAll(path.sep, '/')
}

exports.toRelative = toRelative

/** @param {Context} context */
exports.isScriptsDirectory = function (context) {
  return toRelative(context).startsWith('/scripts')
}

/** @param {Context} context */
exports.isLibDirectory = function (context) {
  return toRelative(context).startsWith('/scripts/lib')
}

/** @param {Context} context */
exports.isModulesDirectory = function (context, filename = context.filename) {
  const relative = toRelative(context, filename)
  return relative.startsWith('/scripts/modules')
}

module.exports.rules = {
  'ensure-modules': require('./rules/ensure-modules'),
  'no-unsupported-features': require('./rules/no-unsupported'),
  'no-cycle': require('./rules/no-cycle.js'),
  'ensure-export-boundaries': require('./rules/ensure-export-boundaries.js'),
  'ensure-lib-exports': require('./rules/ensure-lib-exports.js'),
}
