const { ESLintUtils } = require('@typescript-eslint/utils')
const path = require('path')

/** @type {Record<string, string>} */
const wrongModules = { '@minecraft/vanilla-data': '@minecraft/vanilla-data.js' }

/**
 * @param {{cwd: string, filename: string}} context
 */
function ensureScriptsDirectory(context) {
  const relative = context.filename.replace(context.cwd, '')
  console.debug({ cwd: context.cwd, filename: context.filename, relative })
  if (relative.startsWith(path.sep + 'scripts')) return true
  return false
}

module.exports.rules = {
  'ensure-modules': ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
      if (!ensureScriptsDirectory(context)) return {}
      return {
        ImportDeclaration(node) {
          const importedModuleName = node.source.value
          const rightModule = wrongModules[importedModuleName]

          if (rightModule) {
            context.report({
              node: node.source,
              messageId: 'useDotJs',
              fix(fixer) {
                return fixer.replaceText(node.source, "'" + rightModule + "'")
              },
            })
          }
        },
      }
    },
    meta: {
      docs: {
        description: "Don't use wrong modules.",
      },
      messages: {
        useDotJs: "It's not built-in module, use .js extension to import polyfill.",
      },
      fixable: 'code',
      type: 'problem',
      schema: [],
    },
    defaultOptions: [],
  }),
  'warn-unsupported-features': ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
      if (!ensureScriptsDirectory(context)) return {}
      return {
        StaticBlock(node) {
          context.report({
            node,
            messageId: 'staticBlock',
            fix(fixer) {
              return fixer.replaceText(node, '')
            },
          })
        },
      }
    },
    meta: {
      docs: {
        description: 'Dissallow unsupported features.',
      },
      messages: {
        staticBlock: "Class static initialization block is not supported by Minecraft's QuickJS engine.",
      },
      fixable: 'code',
      type: 'problem',
      schema: [],
    },
    defaultOptions: [],
  }),
}
