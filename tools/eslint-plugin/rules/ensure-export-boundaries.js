const { default: resolve } = require('eslint-module-utils/resolve')
const { ESLintUtils } = require('@typescript-eslint/utils')
const { isLibDirectory, isModulesDirectory } = require('..')

module.exports = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    docs: {
      description: 'Ensures that lib folder does not imports modules code',
    },
    messages: {
      noImportFromLib:
        'File in the lib/ should not depend on the modules. Consider moving shared code into the lib/, or moving this file into to the modules/',
    },
    fixable: 'code',
    type: 'problem',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    if (!isLibDirectory(context)) return {}

    return {
      ImportDeclaration(node) {
        const importedModulePath = resolve(node.source.value, context)

        if (isModulesDirectory(context, importedModulePath)) {
          context.report({
            node: node.source,
            messageId: 'noImportFromLib',
          })
        }
      },
    }
  },
})
