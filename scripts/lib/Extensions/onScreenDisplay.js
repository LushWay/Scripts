import { ScreenDisplay, system } from '@minecraft/server'
import { OverTakes } from './OverTakes.js'

const $sidebar = '§t§i§psidebar',
  $title = 'title',
  $tipPrefix = '§t§i§p'

/** @type {Set<VoidFunction>} */
const titleSet = new Set()

OverTakes(ScreenDisplay.prototype, {
  setTitle(message, options) {
    if (typeof message === 'string') {
      if (!(message.startsWith($sidebar) || message.startsWith($tipPrefix))) {
        message = $title + message
      }

      if (message.startsWith($title) && options) {
        const duration = options.fadeInDuration + options.fadeOutDuration + options.stayDuration

        system.runTimeout(() => this.setTitle(''), 'title unset', duration)
      }
    }

    titleSet.add(() => super.setTitle(message, options))
  },
  setSidebar(text = '') {
    this.setTitle($sidebar + text)
  },
  setTip(n, text = '') {
    this.setTitle($tipPrefix + n + text)
  },
})

system.run(() => {
  system.runInterval(
    () => {
      // Grab first title, set and delete
      const fn = titleSet.values().next()
      if (!fn.done) {
        fn.value()
        titleSet.delete(fn.value)
      }
    },
    'title set',
    0
  )
})
