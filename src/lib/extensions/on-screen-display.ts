import { Player, RawMessage, ScreenDisplay, system, world } from '@minecraft/server'
import { ScreenDisplaySymbol } from 'lib/extensions/player'
import { fromMsToTicks, fromTicksToMs } from 'lib/utils/ms'
import { WeakPlayerMap } from 'lib/weak-player-storage'

export enum ActionbarPriority {
  Highest = 4,
  High = 3,
  PvP = 2,
  Quest = 1,
  Lowest = 0,
}

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

    setActionBar(text: string | RawText, priority: ActionbarPriority): void

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

const titles = new WeakPlayerMap<CommonTitleTypes & OtherScreenDisplayTypes>()

type ScreenDisplayOverrideThis = ThisType<
  {
    player: Player & {
      [ScreenDisplaySymbol]: ScreenDisplay
    }
  } & Omit<ScreenDisplay, 'player'>
>

type ScreenDisplayOverrideTypes = Omit<(typeof ScreenDisplay)['prototype'], 'player'>

export const ScreenDisplayOverride: ScreenDisplayOverrideTypes & ScreenDisplayOverrideThis = {
  isValid: true,

  setHudTitle(message, options, prefix = $title, n = 0) {
    let playerScreenDisplay = titles.get(this.player.id)
    if (!playerScreenDisplay) {
      playerScreenDisplay = { actions: [] }
      titles.set(this.player.id, playerScreenDisplay)
    }

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

    const priority = options.priority ?? 0
    if (screenDisplay.priority > priority) return
    else screenDisplay.priority = priority

    // Workaround to fix overriding title by other displays
    if (prefix !== $title) {
      const titleDisplay = playerScreenDisplay[$title]

      if (titleDisplay && titleDisplay.expires) {
        playerScreenDisplay.actions.push(player => {
          if (!titleDisplay.expires) return

          const stayMs = Date.now() - titleDisplay.expires
          if (stayMs < 0) return

          // @ts-expect-error AAAAAAAAAAAAAAA
          player[ScreenDisplaySymbol].setTitle(`${$title}${titleDisplay.value as string}`, {
            subtitle: titleDisplay.subtitle,
            ...defaultOptions,
            stayDuration: fromMsToTicks(stayMs),
          })
        })
      }
    }

    if (typeof options !== 'undefined' && type === 'title') {
      const totalTicks = options.fadeInDuration + options.fadeOutDuration + options.stayDuration
      if (totalTicks !== -1) {
        screenDisplay.expires = Date.now() + fromTicksToMs(totalTicks)
      } else options.stayDuration = 0
    }

    // Do not update same text
    if (screenDisplay.value === message) {
      if (type === 'title') {
        if (screenDisplay.subtitle === options.subtitle) return
      } else return
    }

    playerScreenDisplay.actions.push(player => {
      try {
        const title = `${prefix === $tipPrefix ? `${prefix}${n}` : prefix}${message}`
        if (typeof options === 'undefined') options = { ...defaultOptions }

        // @ts-expect-error AAAAAAAAAAAAAAA
        player[ScreenDisplaySymbol].setTitle(title, options)
      } catch (e) {
        console.error(e)
      }

      // Update references
      screenDisplay.value = message
      if (type === 'title') {
        screenDisplay.subtitle = options.subtitle
      }
    })
  },

  setSidebar(text = '', priority) {
    this.setHudTitle(text, { priority, ...defaultOptions }, $sidebar)
  },

  setTip(n, text = '', priority) {
    this.setHudTitle(text, { priority, ...defaultOptions }, $tipPrefix, n)
  },

  setActionBar(text, priority: number = ActionbarPriority.Lowest) {
    const lock = actionbarLock.get(this.player)
    if (lock && lock.priority > priority) return
    else actionbarLock.set(this.player, { priority, expires: Date.now() + 1000 * 3 })
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

  resetHudElementsVisibility() {
    return this.player[ScreenDisplaySymbol].resetHudElementsVisibility()
  },

  setHudVisibility(visible, hudElements) {
    return this.player[ScreenDisplaySymbol].setHudVisibility(visible, hudElements)
  },

  isForcedHidden(hudElement) {
    return this.player[ScreenDisplaySymbol].isForcedHidden(hudElement)
  },
}

const actionbarLock = new WeakPlayerMap<{ priority: ActionbarPriority; expires: number }>()

const defaultOptions = { fadeInDuration: 0, fadeOutDuration: 0, stayDuration: 0 }
const defaultTitleOptions = { ...defaultOptions, stayDuration: -1 }

run()

function run() {
  system.run(() => {
    system.runJob(
      (function* () {
        const players = world.getAllPlayers()
        for (const [id, event] of titles.entries()) {
          const player = players.find(e => e.id === id)

          if (!player) {
            titles.delete(id)
            continue
          }

          if (!player.isValid) continue

          if (event.title?.expires && event.title.expires < Date.now()) {
            player.onScreenDisplay.setHudTitle('', {
              ...defaultTitleOptions,
              priority: (event.title.priority as number | undefined) ?? 0,
            })

            titles.delete(id)
          }

          // Take first action and execute it
          event.actions.shift()?.(player)
          yield
        }

        for (const [id, { expires }] of actionbarLock) {
          if (expires < Date.now()) actionbarLock.delete(id)
        }

        run()
      })(),
    )
  })
}
