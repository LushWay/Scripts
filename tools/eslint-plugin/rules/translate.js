import fs from 'fs/promises'
import path from 'path'
import { createRule, toRelative } from '../utils.js'
/** @import {TSESTree} from '@typescript-eslint/utils' */
/** @type {Record<string, { sources: string[]; message: string; literal?: string[] }>} */
const messages = {}
let text = ''
let i = 0

const translateRule = createRule({
  name: 'translate',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect string literals and template literals containing Russian letters and log them.',
    },
    schema: [],
    messages: {
      dontUseLiterals: "Don't use literals. Use t instead",
    },
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    const file = toRelative(context)
    const ignore = ['.test.ts', '.spec.ts', 'world-edit', 'minigames']

    if (ignore.some(e => file.includes(e)) || context.sourceCode.text.includes('/* i18n-ignore */')) return {}

    /**
     * @param {string} t
     * @param {TSESTree.Literal | TSESTree.TemplateLiteral} node
     */
    function addToTranslates(t, node, literal = false) {
      // Ignore Settings.world({ setting: { name: 'Do not translate this' }})
      if (
        node.parent.type == 'Property' &&
        node.parent.parent.type === 'ObjectExpression' &&
        node.parent.parent.parent.type === 'Property' &&
        node.parent.parent.parent.parent.type === 'ObjectExpression' &&
        node.parent.parent.parent.parent.parent.type === 'CallExpression' &&
        node.parent.parent.parent.parent.parent.callee.type === 'MemberExpression' &&
        node.parent.parent.parent.parent.parent.callee.object.type === 'Identifier' &&
        node.parent.parent.parent.parent.parent.callee.object.name === 'Settings' &&
        node.parent.parent.parent.parent.parent.callee.property.type === 'Identifier' &&
        node.parent.parent.parent.parent.parent.callee.property.name === 'world'
      )
        return

      const filelink = `file:///./${file}`.replaceAll(path.sep, '/').replace('C:', '')
      if (!text.includes(filelink)) {
        text += '\n'
        text += '\n'
        text += filelink + '\n'
        text += '\n'
      }
      if (literal) text += 'LITERAL '
      text += t + '\n'
      messages[t] ??= { sources: [], message: t }
      messages[t].sources.push(file)
      if (literal) {
        messages[t].literal = []
        messages[t].literal.push(file)
      }
      i++

      return true
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string' && /[а-яА-Я]/.test(node.value)) {
          if (addToTranslates(node.value, node, true)) {
            context.report({
              node,
              messageId: 'dontUseLiterals',
              fix: fixer => {
                return fixer.replaceText(node, `t\`${node.value}\``)
              },
            })
          }
        }
      },
      TemplateLiteral(node) {
        const r = node.quasis.map(e => e.value.raw).join('${0}')
        if (/[а-яА-Я]/.test(r)) {
          if (node.parent.type === 'TaggedTemplateExpression') {
            const tag =
              node.parent.tag.type === 'Identifier'
                ? node.parent.tag
                : node.parent.tag.type === 'MemberExpression' && node.parent.tag.object.type === 'Identifier'
                  ? node.parent.tag.object
                  : undefined

            const name = tag ? tag.name : undefined
            if (name === 'l') return

            addToTranslates(r, node)
          } else {
            if (addToTranslates(r, node))
              context.report({
                node,
                messageId: 'dontUseLiterals',
                fix: fixer => {
                  return fixer.replaceText(node, `t${context.sourceCode.getText(node)}`)
                },
              })
          }
        }
      },
    }
  },
})

if (process.env.I18N)
  process.once('beforeExit', async () => {
    console.log('Total messages: ', i)
    console.log('Duplicated:', i - Object.keys(messages).length)
    console.log('Literals:', Object.values(messages).filter(e => e.literal).length)
    console.log('\n\n')
    await fs.writeFile('test.txt', text)
  })

export default translateRule
