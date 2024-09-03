import { resolve } from 'eslint-import-resolver-typescript'
import { createRule, isLibDirectory, isModulesDirectory } from '../utils.js'

export default createRule({
  name: 'export-boundaries',
  meta: {
    docs: {
      description: 'Ensures that lib folder does not imports modules code',
    },
    messages: {
      noImportFromLib:
        'File in the lib/ should not depend on the modules. Consider moving shared code into the lib/, or moving this file into to the modules/',
      noLib: "Never use 'lib' inside lib/. This causes tests to fail. Instead, import each module separately.",
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
        if (node.source.value === 'lib') return context.report({ node: node.source, messageId: 'noLib' })

        const importTarget = resolve(node.source.value, context.physicalFilename).path

        if (isModulesDirectory(context, importTarget)) {
          context.report({
            node: node.source,
            messageId: 'noImportFromLib',
          })
        }
      },
    }
  },
})
