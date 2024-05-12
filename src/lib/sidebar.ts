import { Player } from '@minecraft/server'
import { util } from 'lib/util'

type Format =
  | string
  | [string | undefined, string | undefined, string | undefined, string | undefined, string | undefined]

type SidebarLine = string | false

export type DynamicLine<E> = (player: Player, extra: E) => SidebarLine

export type SidebarLineInit<E> = { init(sidebar: Sidebar): DynamicLine<E> }

export type SidebarVariables<E, V = DynamicLine<E>> = Record<string, V | string>

export type SidebarRawVariables<E> = SidebarVariables<E, SidebarLineInit<E> | DynamicLine<E>>

/** Description */
export class Sidebar<E = unknown> {
  static instances: Sidebar[] = []

  content

  getExtra

  getOptions

  name

  constructor(
    {
      name,
      getOptions,
      getExtra,
    }: {
      name: string
      getOptions: (
        p: Player,
        e: E,
      ) => {
        format: Format
        maxWordCount: number
      }
      getExtra: (p: Player) => E
    },
    content: SidebarRawVariables<E>,
  ) {
    this.name = name
    this.getExtra = getExtra
    this.getOptions = getOptions
    this.content = this.init(content)
    Sidebar.instances.push(this)
  }

  private init(content: SidebarRawVariables<E>): SidebarVariables<E> {
    const base: SidebarVariables<E> = {}

    for (const [key, e] of Object.entries(content)) {
      if (typeof e === 'object') {
        base[key] = e.init(this)
      } else base[key] = e
    }

    return base
  }

  show(player: Player) {
    const extra = this.getExtra(player)
    const options = this.getOptions(player, extra)
    let content = options.format

    for (const [key, line] of Object.entries(this.content)) {
      let value = typeof line === 'function' ? line(player, extra) : line
      if (value === false) value = ''

      if (Array.isArray(content)) {
        content = content.map(e => e?.replaceAll('$' + key, value)) as Format
      } else {
        content = content.replaceAll('$' + key, value)
      }
    }

    function wrap(line: string) {
      return line
        .split('\n')
        .map(e => util.wrap(e, options.maxWordCount))
        .flat()
        .join('\n')
    }

    if (Array.isArray(content)) {
      for (const [i, tip] of content.entries()) {
        if (!tip) continue
        const index = i + 1
        if (index !== 1 && index !== 2 && index !== 3 && index !== 4 && index !== 5) continue

        player.onScreenDisplay.setTip(index, wrap(tip))
      }
      player.onScreenDisplay.setSidebar('')
    } else {
      for (const i of [1, 2, 3, 4, 5] as const) player.onScreenDisplay.setTip(i, '')
      player.onScreenDisplay.setSidebar(wrap(content))
    }
  }
}

verbose = true
