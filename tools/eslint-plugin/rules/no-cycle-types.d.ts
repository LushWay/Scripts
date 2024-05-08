import { RuleContext } from 'eslint-plugin-import/types.js'

declare module 'eslint-module-utils/resolve' {
  export default function resolve(name: string, context: RuleContext): string | undefined
}
