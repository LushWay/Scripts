const { ESLintUtils } = require('@typescript-eslint/utils')

/** @type {Record<string, string>} */
const wrongModules = { '@minecraft/vanilla-data': '@minecraft/vanilla-data.js' }

module.exports.rules = {
  'ensure-modules': ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
      return {
        ImportDeclaration(node) {
          const importedModuleName = node.source.value
          const rightModule = wrongModules[importedModuleName]

          if (rightModule) {
            context.report({
              node,
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
        description: "Don't use wrong modules",
      },
      messages: {
        useDotJs:
          'This is not minecraft module, use .js extension for polyfill',
      },
      fixable: 'code',
      type: 'problem',
      schema: [],
    },
    defaultOptions: [],
  }),
}
