import { Player, RawMessage, ScreenDisplay, TicksPerSecond, system, world } from '@minecraft/server'
import { ScreenDisplaySymbol } from 'lib/extensions/player'

declare module '@minecraft/server' {
  interface HudTitleDisplayOptions {
    /** Priority of the displayed information */
    priority?: number
  }

  interface ScreenDisplay {
    /** Player attached to this screen display */
    player: Player

    /**
     * Sets player title
     *
     * @param text Text to set
     */
    setHudTitle(text: string, options: TitleDisplayOptions & HudTitleDisplayOptions, prefix?: string, n?: number): void

    /**
     * Sets player sidebar
     *
     * @param text Text to set
     * @param priority Priority of the displayed information
     */
    setSidebar(text: string, priority?: number): void

    /**
     * Sets player tip
     *
     * @param n Tip position
     * @param text Tip text
     * @param priority Priority of the displayed information
     */
    setTip(n: 1 | 2 | 3 | 4 | 5, text: string, priority?: number): void
  }
}

const $sidebar = '§t§i§psidebar'
const $title = 'title'
const $tipPrefix = '§t§i§p'

type McText = (RawMessage | string)[] | RawMessage | string

interface CommonTitleTypes {
  actions: ((p: Player) => void)[]
  title?: {
    expires?: number
    subtitle?: McText
  }
}

type ScreenDisplayType = 'title' | 'sidebar' | `tip${1 | 2 | 3 | 4 | 5}`

type OtherScreenDisplayTypes = Partial<
  Record<
    ScreenDisplayType,
    {
      value: McText
      priority: number
    }
  >
>

const titles: Record<string, CommonTitleTypes & OtherScreenDisplayTypes> = {}

type ScreenDisplayOverrideThis = ThisType<
  {
    player: Player & {
      [ScreenDisplaySymbol]: ScreenDisplay
    }
  } & Omit<ScreenDisplay, 'player'>
>

type ScreenDisplayOverrideTypes = Omit<(typeof ScreenDisplay)['prototype'], 'player'>

export const ScreenDisplayOverride: ScreenDisplayOverrideTypes & ScreenDisplayOverrideThis = {
  isValid() {
    return this.player[ScreenDisplaySymbol].isValid()
  },

  setHudTitle(message, options, prefix = $title, n = 0) {
    const playerScreenDisplay = (titles[this.player.id] ??= { actions: [] })
    let type: ScreenDisplayType = 'title'

    if (prefix === $tipPrefix) {
      if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) {
        type = `tip${n}`
      }
    } else if (prefix === $sidebar) {
      type = 'sidebar'
    }

    const screenDisplay = (playerScreenDisplay[type] ??= {
      value: '',
      priority: 0,
    })

    const priority = options?.priority ?? 0
    if (screenDisplay.priority > priority) return
    else screenDisplay.priority = priority

    if (options && type === 'title') {
      const totalTicks = options.fadeInDuration + options.fadeOutDuration + options.stayDuration
      if (totalTicks !== -1) {
        screenDisplay.expires = Date.now() + totalTicks * TicksPerSecond
      } else options.stayDuration = 0
    }

    // Do not update same text
    if (screenDisplay.value === message) {
      if (type === 'title') {
        if (screenDisplay.subtitle === options?.subtitle) return
      } else return
    }

    playerScreenDisplay.actions.push(player => {
      if (!player.isValid()) return

      try {
        const title = `${prefix === $tipPrefix ? prefix + n : prefix}${message}`
        options ??= { ...defaultTitleOptions }

        // @ts-expect-error AAAAAAAAAAAAAAA
        player[ScreenDisplaySymbol].setTitle(title, options)
      } catch (e) {
        console.error(e)
      }

      // Update references
      screenDisplay.value = message
      if (type === 'title') {
        screenDisplay.subtitle = options?.subtitle
      }
    })
  },

  setSidebar(text = '', priority) {
    this.setHudTitle(text, { priority, ...defaultOptions }, $sidebar)
  },

  setTip(n, text = '', priority) {
    this.setHudTitle(text, { priority, ...defaultOptions }, $tipPrefix, n)
  },

  setActionBar(text) {
    return this.player[ScreenDisplaySymbol].setActionBar(text)
  },

  updateSubtitle(subtitle) {
    return this.player[ScreenDisplaySymbol].updateSubtitle(subtitle)
  },

  setTitle(title, options) {
    return this.player[ScreenDisplaySymbol].setTitle(title, options)
  },

  getHiddenHudElements() {
    return this.player[ScreenDisplaySymbol].getHiddenHudElements()
  },

  hideAllExcept(hudElements) {
    return this.player[ScreenDisplaySymbol].hideAllExcept(hudElements)
  },

  resetHudElements() {
    return this.player[ScreenDisplaySymbol].resetHudElements()
  },

  setHudVisibility(visible, hudElements) {
    return this.player[ScreenDisplaySymbol].setHudVisibility(visible, hudElements)
  },

  isForcedHidden(hudElement) {
    return this.player[ScreenDisplaySymbol].isForcedHidden(hudElement)
  },
}

const defaultOptions = { fadeInDuration: 0, fadeOutDuration: 0, stayDuration: 0 }
const defaultTitleOptions = { ...defaultOptions, stayDuration: -1 }

system.run(() => {
  system.runInterval(
    () => {
      const players = world.getAllPlayers()
      for (const [id, event] of Object.entries(titles)) {
        const player = players.find(e => e.id === id)

        if (event.title?.expires && event.title.expires < Date.now()) {
          player?.onScreenDisplay.setHudTitle('', {
            ...defaultTitleOptions,

            priority: event.title.priority ?? 0,
          })

          delete titles[id]
        }

        if (player) {
          // Take first action and execute it
          event.actions.shift()?.(player)
        }
      }
    },
    'title set',
    1,
  )
})
