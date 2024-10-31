import fs from 'fs/promises'
import path from 'path'
import { createRule, toRelative } from '../utils.js'
/** @import {TSESTree} from '@typescript-eslint/utils' */
/** @type {Record<string, string>} */
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
    messages: {},
  },
  defaultOptions: [],
  create(context) {
    /**
     * @param {string} t
     * @param {TSESTree.Literal | TSESTree.TemplateLiteral} node
     */
    function addToTranslates(t, node) {
      const file = toRelative(context)
      const ignore = ['.test.ts', '.spec.ts', 'world-edit', 'minigames']

      if (ignore.some(e => file.includes(e)) || context.sourceCode.text.includes('/* i18n-ignore */')) return

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

      const filelink = `file://${context.cwd}${file}`.replaceAll(path.sep, '/').replace('C:', '')
      if (!text.includes(filelink)) {
        text += '\n'
        text += '\n'
        text += filelink + '\n'
        text += '\n'
      }
      text += t + '\n'
      messages[t] ??= ''
      messages[t] += file
      i++
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string' && /[а-яА-Я]/.test(node.value)) {
          addToTranslates(node.value, node)
        }
      },
      TemplateLiteral(node) {
        const r = node.quasis.map(e => e.value.raw).join('${0}')
        if (/[а-яА-Я]/.test(r)) {
          addToTranslates(r, node)
        }
      },
    }
  },
})

if (process.env.I18N)
  process.once('beforeExit', async () => {
    console.log('Total messages: ', i)
    console.log('Duplicated:', i - Object.keys(messages).length)
    console.log('\n\n')
    await fs.writeFile('test.txt', text)
  })

export default translateRule
