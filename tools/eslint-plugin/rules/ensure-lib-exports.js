const { default: resolve } = require('eslint-module-utils/resolve')
const { ESLintUtils } = require('@typescript-eslint/utils')
const { isLibDirectory, toRelative } = require('..')
const fs = require('fs')
const { join, sep } = require('path')

// This is disabled rule because its hard to implement it without big amount of false positivies

module.exports = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    docs: {
      description: 'Ensures that lib.js file reexports every file from the lib folder.',
    },
    messages: {
      noImportFromLib: 'Lib should not depend on any modules. Consider moving code to the modules/ folder.',
    },
    fixable: 'code',
    type: 'problem',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    if (toRelative(context) !== '/scripts/lib.js') return {}

    return {
      Program(node) {
        const exportList = node.body
          .map(e => {
            if (e.type === 'ExportAllDeclaration') {
              const file = resolve(e.source.value, context)
              if (file) return toRelative(context, file)
            }
          })
          .filter(Boolean)

        console.log({ exportList })

        recurse('scripts/lib')

        /** @param {string} path */
        function recurse(path) {
          if (fs.statSync(path).isDirectory()) {
            for (const entry of fs.readdirSync(path)) recurse(join(path, entry))
          } else {
            const file = '/' + path.replaceAll(sep, '/')
            if (!exportList.includes(file)) console.log({ file })
          }
        }
      },
      // ImportDeclaration(node) {
      //   const importedModulePath = resolve(node.source.value, context)

      //   if (isModulesDirectory(context, importedModulePath)) {
      //     context.report({
      //       node: node.source,
      //       messageId: 'noImportFromLib',
      //     })
      //   }
      // },
    }
  },
})
