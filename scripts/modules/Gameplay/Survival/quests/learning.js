import { world } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { Quest } from 'lib/Class/Quest.js'
import { Sidebar } from 'lib/Class/Sidebar.js'
import { Temporary } from 'lib/Class/Temporary.js'
import { ActionForm } from 'smapi.js'
import { ANARCHY } from '../anarchy.js'
import { SPAWN } from '../spawn.js'

if (ANARCHY.portal) {
  const learning = new Quest('Обучение', q => {
    if (!ANARCHY.portal || !ANARCHY.portal.from || !ANARCHY.portal.to)
      return q.failed('§cСервер не настроен')

    q.start(function () {
      this.player.tell('§6Квест начался!')
      this.player.playSound(SOUNDS.action)
    })

    q.place(ANARCHY.portal.from, ANARCHY.portal.to, '§6Зайди в портал анархии')

    q.counter({
      end: 5,
      text(value) {
        return `§6Наруби §f${value}/${this.end} §6блоков дерева`
      },
      activate() {
        return new Temporary(({ world }) => {
          world.afterEvents.playerBreakBlock.subscribe(({ player, block }) => {
            if (player.id !== this.player.id) return
            if (!SPAWN.startAxeCanBreak.includes(block.type.id)) return

            this.diff(1)
          })
        })
      },
    })

    q.end(function () {
      this.player.playSound(SOUNDS.success)
      this.player.tell('§6Квест закончен!')
    })
  })
}
