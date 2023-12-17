const { ESLintUtils } = require('@typescript-eslint/utils')
const { ensureScriptsDirectory } = require('..')

module.exports = ESLintUtils.RuleCreator.withoutDocs({
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
})
