import { Player, ScreenDisplay, TicksPerSecond, system, world } from '@minecraft/server'
import { SCREEN_DISPLAY } from 'lib/extensions/player'
import { util } from 'lib/util'

const $sidebar = '§t§i§psidebar'
const $title = 'title'
const $tipPrefix = '§t§i§p'

/** @typedef {'title' | 'sidebar' | `tip${1 | 2 | 3 | 4 | 5}`} TitleType */

/**
 * @type {Record<
 *   string,
 *   {
 *     actions: ((p: Player) => void)[]
 *     title?: {
 *       expires?: number
 *       subtitle?: McText
 *     }
 *   } & {
 *     [K in TitleType]?:
 *       | {
 *           value: McText
 *           priority: number
 *         }
 *       | undefined
 *   }
 * >}
 */
const TITLES = {}

/**
 * @type {Omit<(typeof ScreenDisplay)['prototype'], 'player'> &
 *   ThisType<{ player: Player & { [SCREEN_DISPLAY]: ScreenDisplay } } & Omit<ScreenDisplay, 'player'>>}
 */
export const SCREEN_DISPLAY_OVERRIDE = {
  // @ts-expect-error TS(7023) FIXME: 'isValid' implicitly has return type 'any' because... Remove this comment to see the full error message
  isValid() {
    // @ts-expect-error TS(2339) FIXME: Property 'player' does not exist on type '{ isVali... Remove this comment to see the full error message
    return this.player[SCREEN_DISPLAY].isValid()
  },
  setHudTitle(message, options, prefix = $title, n = 0) {
    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const PLAYER_SD = (TITLES[this.player.id] ??= { actions: [] })

    /** @type {TitleType} */
    let SD_TYPE = 'title'

    if (prefix === $tipPrefix) {
      if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) {
        SD_TYPE = `tip${n}`
      }
    } else if (prefix === $sidebar) {
      SD_TYPE = 'sidebar'
    }

    const SD = (PLAYER_SD[SD_TYPE] ??= {
      value: '',
      priority: 0,
    })

    const priority = options?.priority ?? 0
    if (SD.priority > priority) return
    else SD.priority = priority

    if (options && SD_TYPE === 'title') {
      const totalTicks = options.fadeInDuration + options.fadeOutDuration + options.stayDuration
      if (totalTicks !== -1) {
        SD.expires = Date.now() + totalTicks * TicksPerSecond
      } else options.stayDuration = 0
    }

    // Do not update same text
    if (SD.value === message) {
      if (SD_TYPE === 'title') {
        if (SD.subtitle === options?.subtitle) return
      } else return
    }

    PLAYER_SD.actions.push(player => {
      if (!player.isValid()) return

      try {
        const title = `${prefix === $tipPrefix ? prefix + n : prefix}${message}`
        options ??= { ...defaultTitleOptions }

        player[SCREEN_DISPLAY].setTitle(title, options)
      } catch (e) {
        util.error(e)
      }

      // Update references
      SD.value = message
      if (SD_TYPE === 'title') {
        SD.subtitle = options?.subtitle
      }
    })
  },
  setSidebar(text = '', priority) {
    this.setHudTitle(text, { priority, ...defaultOptions }, $sidebar)
  },
  setTip(n, text = '', priority) {
    this.setHudTitle(text, { priority, ...defaultOptions }, $tipPrefix, n)
  },

  // @ts-expect-error TS(7023) FIXME: 'setActionBar' implicitly has return type 'any' be... Remove this comment to see the full error message
  setActionBar(text) {
    // @ts-expect-error TS(2339) FIXME: Property 'player' does not exist on type '{ isVali... Remove this comment to see the full error message
    return this.player[SCREEN_DISPLAY].setActionBar(text)
  },

  // @ts-expect-error TS(7023) FIXME: 'updateSubtitle' implicitly has return type 'any' ... Remove this comment to see the full error message
  updateSubtitle(subtitle) {
    // @ts-expect-error TS(2339) FIXME: Property 'player' does not exist on type '{ isVali... Remove this comment to see the full error message
    return this.player[SCREEN_DISPLAY].updateSubtitle(subtitle)
  },

  // @ts-expect-error TS(7023) FIXME: 'setTitle' implicitly has return type 'any' becaus... Remove this comment to see the full error message
  setTitle(title, options) {
    // @ts-expect-error TS(2339) FIXME: Property 'player' does not exist on type '{ isVali... Remove this comment to see the full error message
    return this.player[SCREEN_DISPLAY].setTitle(title, options)
  },
}

const defaultOptions = { fadeInDuration: 0, fadeOutDuration: 0, stayDuration: 0 }
const defaultTitleOptions = { ...defaultOptions, stayDuration: -1 }

system.run(() => {
  system.runInterval(
    () => {
      const players = world.getAllPlayers()
      for (const [id, data] of Object.entries(TITLES)) {
        const player = players.find(e => e.id === id)

        // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
        if (data.title?.expires && data.title.expires < Date.now()) {
          player?.onScreenDisplay.setHudTitle('', {
            ...defaultTitleOptions,

            // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
            priority: data.title.priority ?? 0,
          })

          // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          delete TITLES[id]
        }

        if (player) {
          // Take first action and execute it

          // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
          data.actions.shift()?.(player)
        }
      }
    },
    'title set',
    1,
  )
})
