import { Player } from '@minecraft/server'
import { CONFIG } from './assets/config'
import { ROLES, getRole } from './roles'
import { util } from './util'

export type Text = string
interface TStatic {
  error: TFn & Omit<TStatic, 'error'>
  roles: (text: TemplateStringsArray, ...players: Player[]) => Text
  badge: (text: TemplateStringsArray, n: number) => Text
  plurals: (text: TemplateStringsArray, n: number, plurals: [one: string, two: string, five: string]) => Text
  time: (text: TemplateStringsArray, time: number) => Text
  options: (options: ColorizingOptions) => TStatic
}

type TFn = (text: TemplateStringsArray, ...args: unknown[]) => Text

function createSingleConcat(
  options?: ColorizingOptions,
  fn = (string: string, arg: unknown) => string + textUnitColorize(arg, options),
) {
  const textColor = options?.textColor ?? '§7'
  return function t(text, ...args) {
    return text.raw.reduce((previous, string, i) => previous + fn(string, args[i]) + textColor, textColor)
  } as TFn & TStatic
}

function createMultiConcat(options: ColorizingOptions = {}) {
  const t = createSingleConcat(options)
  t.roles = createSingleConcat({ roles: true, ...options })
  t.badge = createSingleConcat({ badge: true, ...options })
  t.plurals = createSingleConcat({ plurals: true, ...options })
  t.time = createSingleConcat({ time: true, ...options })
  t.error = createSingleConcat({ textColor: '§c', unitColor: '§f', ...options })
  t.options = options => createMultiConcat(options)
  return t
}

export const t = createMultiConcat()

export function textTable(table: Record<string, unknown>) {
  return Object.entries(table)
    .map(([key, value]) => `§7${key}: ${textUnitColorize(value)}`)
    .join('\n')
}

interface ColorizingOptions {
  unitColor?: string
  textColor?: string
  roles?: boolean
  badge?: boolean
  plurals?: boolean
  time?: boolean
}

export function textUnitColorize(unit: unknown, options: ColorizingOptions = {}) {
  const { unitColor = '§f' } = options
  switch (typeof unit) {
    case 'string':
      return unitColor + unit

    case 'undefined':
      return ''

    case 'object':
      if (unit instanceof Player) {
        if (options.roles) return `${ROLES[getRole(unit.id)]}§r ${unitColor}${unit.name}`
        else return unitColor + unit.name
      } else if (globalThis.Command && unit instanceof Command) {
        return unitColor + CONFIG.commandPrefixes[0] + unit.sys.name
      } else return util.inspect(unit)

    case 'symbol':
    case 'function':
      return '§c<>§r'

    case 'number':
    case 'bigint':
      return '§6' + unit + '§r'

    case 'boolean':
      return unit ? '§fДа' : '§cНет'
  }
}
