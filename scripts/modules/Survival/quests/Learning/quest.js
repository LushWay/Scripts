import { system } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { Anarchy } from 'modules/Survival/Place/Anarchy.js'
import { Quest, Temporary } from 'smapi.js'
import { LEARNING } from './index.js'
import { LEARNING_L } from './lootTables.js'

export const LEARNING_Q = new Quest({ displayName: 'Обучение', name: 'learning' }, q => {
  if (!Anarchy.portal || !Anarchy.portal.from || !Anarchy.portal.to || LEARNING.RTP_LOCATION.valid)
    return q.failed('§cСервер не настроен')

  q.start(function () {
    this.player.tell('§6Обучение!')
    this.player.playSound(SOUNDS.action)
  })

  q.place(Anarchy.portal.from, Anarchy.portal.to, '§6Зайди в портал анархии')

  q.counter({
    end: 5,
    text(value) {
      return `§6Наруби §f${value}/${this.end} §6блоков дерева`
    },
    activate(firstTime) {
      if (firstTime) {
        // Delay code by one tick to prevent giving item
        // in spawn inventory that will be replaced with
        // anarchy
        system.delay(() => {
          this.player.getComponent('inventory').container.addItem(LEARNING.AXE)
        })
      }

      return new Temporary(({ world }) => {
        world.afterEvents.playerBreakBlock.subscribe(({ player, brokenBlockPermutation }) => {
          if (player.id !== this.player.id) return
          if (!LEARNING.AXE_BREAKS.includes(brokenBlockPermutation.type.id)) return

          this.player.playSound(SOUNDS.action)
          this.diff(1)
        })
      })
    },
  })

  q.airdrop({
    lootTable: LEARNING_L,
  })

  q.end(function () {
    this.player.playSound(SOUNDS.success)
    this.player.tell('§6Обучение закончено!')
  })
})
