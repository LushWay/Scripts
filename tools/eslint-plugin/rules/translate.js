import fs from 'fs/promises'
import path from 'path'
import { createRule, toRelative } from '../utils.js'

// TODO Write?
const supportedLangs = ['en_US', 'ru_RU']

const sourceCodeLang = 'ru_RU'

/** @template T */
class Writer {
  /** @type {string} */
  base

  /** @type {Record<string, Record<string, T>>} */
  storage = {}

  constructor(base = 'lang') {
    this.base = base
  }

  /** @param {string} lang */
  #path(lang) {
    return path.join(this.base, lang + '.json')
  }

  readAll() {
    return Promise.all(supportedLangs.map(e => this.read(e)))
  }

  writeAll() {
    return Promise.all(supportedLangs.map(e => this.write(e)))
  }

  /**
   * @param {string} lang
   * @param {Record<string, T>} data
   */
  write(lang, data = { ...this.storage[sourceCodeLang], ...this.storage[lang] }) {
    for (const key in data) {
      if (!(key in this.storage[sourceCodeLang])) {
        const value = data[key]
        delete data[key]
        data['__UNUSED__' + key] = value
      }
    }
    return fs.writeFile(this.#path(lang), (JSON.stringify(data, null, 2) + '\n').replaceAll('\n', '\r\n'), 'utf-8')
  }

  /**
   * @param {string} lang
   * @returns {Promise<Record<string, T>>}
   */
  async read(lang) {
    /** @type {Record<string, T>} */
    let parsed = {}

    try {
      parsed = JSON.parse(await fs.readFile(this.#path(lang), 'utf-8'))
    } catch (e) {
      console.warn('Unable to read lang', lang, 'with base', this.base, e)
    }

    if (lang === sourceCodeLang) {
      this.storage[lang] = parsed
    } else {
      this.storage[lang] = {
        ...parsed,
        ...(this.storage[lang] ?? {}),
      }
    }

    console.log('Read', lang, 'with keys', Object.keys(parsed).length)

    return parsed
  }
}

/** @import {TSESTree} from '@typescript-eslint/utils' */
/** @type {Record<string, { sources: string[]; message: string; shared: boolean; id: string }>} */
const messages = {}

/** @type {Writer<string | string[]>} */
const messagesJson = new Writer('lang')

/** @type {Writer<string>} */
const sharedMessages = new Writer('texts')
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
     * @param {string[]} template
     */
    function addToTranslates(t, node, template, shared = false) {
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
      text += t + '\n'
      messages[t] ??= { sources: [], message: t, shared, id: templateToSharedId(template) }
      messages[t].sources.push(file)

      messagesJson.storage[sourceCodeLang][t] = template.length === 1 ? template[0] : template
      i++

      return true
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string' && /[а-яА-Я]/.test(node.value)) {
          if (addToTranslates(node.value, node, [node.value])) {
            context.report({
              node,
              messageId: 'dontUseLiterals',
              fix: fixer => {
                return fixer.replaceText(node, `i18n\`${node.value}\``)
              },
            })
          }
        }
      },
      TemplateLiteral(node) {
        const template = node.quasis.map(e => e.value.raw)
        // if (template.at(-1) === '') template.pop
        const r = template.join('\x00')
        if (/[а-яА-Я]/.test(r)) {
          if (node.parent.type === 'TaggedTemplateExpression') {
            const tag =
              node.parent.tag.type === 'Identifier'
                ? node.parent.tag
                : node.parent.tag.type === 'MemberExpression' && node.parent.tag.object.type === 'Identifier'
                  ? node.parent.tag.object
                  : undefined

            const name = tag ? tag.name : undefined
            if (name === 'noI18n' || name === 'i18nJoin') return

            if (name === 'i18nShared') {
              sharedMessages.storage[sourceCodeLang][templateToSharedId(template)] = template
                .join('%s')
                .replaceAll('\n', '~LINEBREAK~')
            }
            addToTranslates(r, node, template, name === 'i18nShared')
          } else {
            if (addToTranslates(r, node, template))
              context.report({
                node,
                messageId: 'dontUseLiterals',
                fix: fixer => {
                  return fixer.replaceText(node, `i18n${context.sourceCode.getText(node)}`)
                },
              })
          }
        }
      },
    }
  },
})

if (process.env.I18N) {
  await sharedMessages.readAll()
  await messagesJson.readAll()

  process.once('beforeExit', async () => {
    console.log('Total messages: ', i)
    console.log('Duplicated:', i - Object.keys(messages).length)
    console.log('\n\n')
    await fs.writeFile('lang/source.txt', text)

    await sharedMessages.writeAll()
    await messagesJson.writeAll()

    await fs.writeFile(
      path.join('src/lib/assets', 'lang-messages.ts'),
      `
/* eslint-ignore */
/* i18n-ignore */
// Autogenerated by translate plugin

export const extractedSharedMessagesIds: Record<string, string> = ${JSON.stringify(Object.fromEntries(Object.entries(sharedMessages.storage[sourceCodeLang]).map(e => [e[1], e[0]])))}

export const extractedTranslatedMessages: Record<string, Record<string, string | readonly string[]>> = ${JSON.stringify(messagesJson.storage)}`,
    )
  })
}

export default translateRule

/** @param {string[]} template */
function templateToSharedId(template) {
  return (
    'script.shared.' +
    template.map(e => e.toLowerCase().replaceAll(' ', '_').replace(/§./g, '').replaceAll('\n', '<LINEBREAK>')).join('.')
  )
}
