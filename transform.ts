// @ts-check

import { API, CallExpression, FileInfo, NewExpression } from 'jscodeshift'

export default function transformer(fileInfo: FileInfo, api: API) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Find all instances of "new Command({...})"
  root
    .find(j.CallExpression, {
      callee: {
        property: { name: 'literal' },
      },
      arguments: [{ type: 'ObjectExpression' }],
    })
    .forEach(path => {
      const object = path.node.arguments[0]
      if (object.type !== 'ObjectExpression') return

      const properties = object.properties
      const name = properties.find(
        p => p.type === 'Property' && p.kind === 'init' && p.key.type === 'Identifier' && p.key.name === 'name',
      )

      if (!name) return
      if (name.type !== 'Property') return
      if (name.value.type !== 'Literal' && name.value.type !== 'Identifier') return

      // Create the new chained expression
      let newExpression: NewExpression | CallExpression = j.callExpression(path.value.callee, [name.value])

      // Add each property as a chained method call
      properties
        .filter(p => p !== name)
        .forEach(p => {
          if (!(p.type === 'Property' && p.kind === 'init' && p.key.type === 'Identifier')) return

          const value = p.value

          let args: any[] = []
          if (value.type === 'ArrayExpression') {
            args = value.elements
          } else {
            args = [value]
          }

          newExpression = j.callExpression(j.memberExpression(newExpression, j.identifier(p.key.name), false), args)
        })

      // Replace the original expression with the new one
      j(path).replaceWith(newExpression)
    })

  return root.toSource()
}
