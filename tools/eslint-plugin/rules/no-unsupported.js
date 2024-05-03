const { ESLintUtils } = require('@typescript-eslint/utils')
const { isScriptsDirectory } = require('..')

module.exports = ESLintUtils.RuleCreator.withoutDocs({
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
  create(context) {
    if (!isScriptsDirectory(context)) return {}
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
})
