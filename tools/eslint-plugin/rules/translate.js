import { ESLintUtils } from '@typescript-eslint/utils'
import fs from 'fs/promises'

/** @type {Record<string, string>} */
const messages = {}
let text = ''
let i = 0
const createRule = ESLintUtils.RuleCreator(name => `https://example.com/rule/${name}`)

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
    /** @param {string} t */
    function a(t) {
      const file =  context.physicalFilename.replace(process.cwd(), '') + ' '

      if (file && (file.includes(".test.ts") || file.includes(".spec.ts") || file.includes("world-edit")) || file.includes("minigames")) return

      if (!text.includes('$: ' + file)) {
        text += '\n'
        text += '\n'
        text += '$: ' + file + '\n'
        text += "\n"
      }
      text += t + "\n"
      messages[t] ??= ''
      messages[t] += file 
i++
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string' && /[а-яА-Я]/.test(node.value)) {
          a(node.value)
        }
      },
      TemplateLiteral(node) {
        const r = node.quasis.map(e => e.value.raw).join('${0}')
        if (/[а-яА-Я]/.test(r)) {
          a(r)
        }
      },
    }
  },
})

process.once('beforeExit', async () => {
  console.log('\n\n')
  console.log('Total messages: ', i)
  console.log('Duplicated:', i - Object.keys(messages).length)
  console.log('\n\n')
  await fs.writeFile('test.txt', text)
})

export default translateRule
