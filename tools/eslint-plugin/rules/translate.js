import fs from 'fs/promises'
import path from 'path'
import { sourceCodeLang } from '../asset-lang.js'
import { addTranslation, messagesJson, readMessages, writeMessages } from '../lang.js'
import { createRule, toRelative } from '../utils.js'

/** @import {TSESTree} from '@typescript-eslint/utils' */
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
      dontUseLiterals: "Don't use literals. Use i18n, noI18n or other subtypes instead",
    },
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    const file = toRelative(context)
    const ignore = ['.test.ts', '.spec.ts', 'world-edit', 'minigames']

    if (ignore.some(e => file.includes(e)) || context.sourceCode.text.includes('/* i18n-ignore */')) return {}

    return {
      Literal(node) {
        if (typeof node.value === 'string' && /[а-яА-Я]/.test(node.value) && !isInsideWorldSettings(node)) {
          context.report({
            node,
            messageId: 'dontUseLiterals',
            fix: fixer => fixer.replaceText(node, `i18n\`${node.value}\``),
          })
        }
      },
      TemplateLiteral(node) {
        const templateStrings = node.quasis.map(e => e.value.raw)
        const idWithNull = templateStrings.join('\x00')

        if (/[а-яА-Я]/.test(idWithNull)) {
          const template = node.parent
          if (template.type === 'TaggedTemplateExpression') {
            const tag =
              template.tag.type === 'Identifier'
                ? { name: template.tag.name }
                : template.tag.type === 'MemberExpression' && template.tag.object.type === 'Identifier'
                  ? { name: template.tag.object.name, property: template.tag.property }
                  : undefined

            const name = tag?.name
            const subname = tag?.property?.type === 'Identifier' ? tag.property.name : undefined

            if (name === 'noI18n' || name == 'noI18nShared') return

            if (subname === 'join') return

            const filelink = `file:///./${file}`.replaceAll(path.sep, '/')
            if (!text.includes(filelink)) text += '\n\n' + filelink + '\n'
            text += idWithNull.replaceAll('\x00', '{0}') + '\n'
            i++

            const shared = name === 'i18nShared'
            const plural = name === 'i18nPlural'

            // Build the placeholder ID from the quasis and expressions
            const expressions = template.quasi.expressions
            let id = ''
            for (let i = 0; i < templateStrings.length; i++) {
              id += templateStrings[i]
              if (i < expressions.length) {
                const exprText = context.sourceCode.getText(expressions[i])
                // Sanitise the expression text to create a readable label
                let label = exprText.replace(/[^\w]/g, '_')
                // If the label is purely numeric, omit it to avoid confusion
                if (label && /^\d+$/.test(label)) label = ''
                const placeholder = label ? `{${i}_${label}}` : `{${i}}`
                id += placeholder
              }
            }

            addTranslation(id, shared, plural)
          } else if (!isInsideWorldSettings(node)) {
            context.report({
              node,
              messageId: 'dontUseLiterals',
              fix: fixer => fixer.replaceText(node, `i18n${context.sourceCode.getText(node)}`),
            })
          }
        }
      },
    }
  },
})

/** @param {TSESTree.Literal | TSESTree.TemplateLiteral} node */
function isInsideWorldSettings(node) {
  // Ignore Settings.world({ setting: { name: 'Do not translate this', desc: 'too' }})
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
    return true

  return false
}

if (process.env.I18N) {
  await readMessages()

  // There is no other way to check if eslint is done
  process.once('beforeExit', async () => {
    console.log('Total messages: ', i)
    console.log('Duplicated:', i - Object.keys(messagesJson.storage[sourceCodeLang]).length)
    console.log('\n\n')

    await fs.writeFile('lang/source.txt', text)
    await writeMessages()
  })
}

export default translateRule
