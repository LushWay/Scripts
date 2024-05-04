const { ESLintUtils } = require('@typescript-eslint/utils')
const { isScriptsDirectory } = require('..')

/** @type {Record<string, string>} */
const WRONG_MODULES = { '@minecraft/vanilla-data': '@minecraft/vanilla-data.js' }

module.exports = ESLintUtils.RuleCreator.withoutDocs({
  create(context) {
    if (!isScriptsDirectory(context)) return {}
    return {
      ImportDeclaration(node) {
        const importedModuleName = node.source.value
        const rightModule = WRONG_MODULES[importedModuleName]

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
})
