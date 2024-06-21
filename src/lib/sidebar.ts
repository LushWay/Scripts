import { Player } from '@minecraft/server'
import { util } from 'lib/util'

type Format =
  | string
  | [string | undefined, string | undefined, string | undefined, string | undefined, string | undefined]

type SidebarLine = string | false

export type DynamicLine<E> = (player: Player, extra: E) => SidebarLine

export interface SidebarLineCreate<E> {
  create(sidebar: Sidebar): DynamicLine<E>
}

export type SidebarVariables<E, V = DynamicLine<E>> = Record<string, V | string>

export type SidebarRawVariables<E> = SidebarVariables<E, SidebarLineCreate<E> | DynamicLine<E>>

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
        base[key] = e.create(this)
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

    if (Array.isArray(content)) {
      this.clearSidebar(player)
      for (const [i, tip] of content.entries()) {
        player.onScreenDisplay.setTip((i + 1) as 1 | 2 | 3 | 4 | 5, this.wrap(tip ?? '', options.maxWordCount))
      }
    } else {
      this.clearTips(player)
      player.onScreenDisplay.setSidebar(this.wrap(content, options.maxWordCount))
    }
  }

  private wrap(line: string, maxWordCount: number) {
    return line
      .split('\n')
      .map(e => util.wrap(e, maxWordCount))
      .flat()
      .join('\n')
  }

  private clearSidebar(player: Player) {
    player.onScreenDisplay.setSidebar('')
  }

  private clearTips(player: Player) {
    for (const i of [1, 2, 3, 4, 5] as const) player.onScreenDisplay.setTip(i, '')
  }
}

verbose = true
