/**
 * @file Ensures that no imported module imports the linted module.
 * @author Ben Mosher
 */
// @ts-nocheck

const { ESLintUtils } = require('@typescript-eslint/utils')
const { default: resolve } = require('eslint-module-utils/resolve')
const { default: Exports } = require('eslint-plugin-import/lib/ExportMap.js')
const { isExternalModule } = require('eslint-plugin-import/lib/core/importType')
const { makeOptionsSchema, default: moduleVisitor } = require('eslint-module-utils/moduleVisitor')

const traversed = new Set()

module.exports = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    messages: {},
    docs: {
      description: 'Forbid a module from importing a module with a dependency path back to itself.',
    },
    schema: [
      makeOptionsSchema({
        maxDepth: {
          anyOf: [
            {
              description: 'maximum dependency depth to traverse',
              type: 'integer',
              minimum: 1,
            },
            {
              enum: ['∞'],
              type: 'string',
            },
          ],
        },
        ignoreExternal: {
          description: 'ignore external modules',
          type: 'boolean',
          default: false,
        },
        allowUnsafeDynamicCyclicDependency: {
          description: 'Allow cyclic dependency if there is at least one dynamic import in the chain',
          type: 'boolean',
          default: false,
        },
      }),
    ],
  },

  defaultOptions: [
    {
      maxDepth: 3,
      ignoreExternal: true,
      allowUnsafeDynamicCyclicDependency: false,
    },
  ],

  create(context) {
    const myPath = context.physicalFilename ? context.physicalFilename : context.filename
    if (myPath === '<text>') {
      return {}
    } // can't cycle-check a non-file

    const options = context.options[0] || {}
    const maxDepth = typeof options.maxDepth === 'number' ? options.maxDepth : Infinity
    const ignoreModule = (/** @type {string} */ name) =>
      options.ignoreExternal && isExternalModule(name, resolve(name, context), context)

    function checkSourceValue(sourceNode, importer) {
      // ignore external modules
      if (ignoreModule(sourceNode.value)) return

      // if (
      //   options.allowUnsafeDynamicCyclicDependency &&
      //   (importer.type === 'ImportExpression' ||
      //     // `require()` calls are always checked (if possible)
      //     (importer.type === 'CallExpression' && importer.callee.name !== 'require'))
      // ) {
      //   return // cycle via dynamic import allowed by config
      // }

      if (
        importer.type === 'ImportDeclaration' &&
        // import type { Foo } (TS and Flow)
        (importer.importKind === 'type' ||
          // import { type Foo } (Flow)
          importer.specifiers.every(({ importKind }) => importKind === 'type'))
      ) {
        return // ignore type imports
      }

      const imported = Exports.get(sourceNode.value, context)

      if (imported == null) {
        return // no-unresolved territory
      }

      if (imported.path === myPath) {
        return // no-self-import territory
      }

      if (importer.type === 'ImportDeclaration' && !importer.specifiers.find(e => isValueUsed(e.local.name))) {
        return // Imported value not used at the top level
      }
      function isValueUsed(identifierName) {
        const scopeManager = context.sourceCode.getScope(sourceNode)
        let isUsed = false

        // Find the variable that the identifier refers to
        const variable = scopeManager.set.get(identifierName)

        // If the variable is found and is a defined variable
        if (variable.isValueVariable && variable.defs.length) {
          for (const reference of variable.references) {
            // Check if the reference is a read reference (i.e., the value is used)
            if (reference.isRead()) {
              const refScope = reference.from
              if (refScope.type === 'module') {
                isUsed = true
                break
              }
            }
          }
        }

        // console.debug({file: myPath, identifierName, isUsed})

        return isUsed
      }

      const untraversed = [{ mget: () => imported, route: [] }]
      function detectCycle({ mget, route }) {
        const m = mget()
        if (m == null) {
          return
        }
        if (traversed.has(m.path)) {
          return
        }
        traversed.add(m.path)

        for (const [path, { getter, declarations }] of m.imports) {
          if (traversed.has(path)) {
            continue
          }
          const toTraverse = [...declarations].filter(
            ({ source, isOnlyImportingTypes }) =>
              !ignoreModule(source.value) &&
              // Ignore only type imports
              !isOnlyImportingTypes,
          )

          /*
          If cyclic dependency is allowed via dynamic import, skip checking if any module is imported dynamically
          */
          if (options.allowUnsafeDynamicCyclicDependency && toTraverse.some(d => d.dynamic)) {
            return
          }

          /*
          Only report as a cycle if there are any import declarations that are considered by
          the rule. For example:

          a.ts:
          import { foo } from './b' // should not be reported as a cycle

          b.ts:
          import type { Bar } from './a'
          */
          if (path === myPath && toTraverse.length > 0) {
            return true
          }
          if (route.length + 1 < maxDepth) {
            for (const { source } of toTraverse) {
              untraversed.push({ mget: getter, route: route.concat(source) })
            }
          }
        }
      }

      while (untraversed.length > 0) {
        const next = untraversed.shift() // bfs!
        if (detectCycle(next)) {
          const message =
            next.route.length > 0 ? `Dependency cycle via ${routeString(next.route)}` : 'Dependency cycle detected.'
          context.report(importer, message)
          return
        }
      }
    }

    return Object.assign(moduleVisitor(checkSourceValue, context.options[0]), {
      'Program:exit'() {
        traversed.clear()
      },
    })
  },
})

function routeString(route) {
  return route.map(s => `${s.value}:${s.loc.start.line}`).join('=>')
}
