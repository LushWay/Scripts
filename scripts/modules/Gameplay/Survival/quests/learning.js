import { Vector, system } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { Quest } from 'lib/Class/Quest.js'
import { Temporary } from 'lib/Class/Temporary.js'
import { LEARNING_L } from 'modules/Gameplay/Survival/lootTables/learning.js'
import { Airdrop } from 'modules/Server/Class/Airdrop.js'
import { JOIN } from 'modules/Server/PlayerJoin/var.js'
import { ANARCHY } from '../anarchy.js'
import { SPAWN } from '../spawn.js'

JOIN.EVENTS.firstTime.subscribe(player => {
  LEARNING_Q.enter(player)
})

export const LEARNING_Q = new Quest(
  { displayName: 'Обучение', name: 'learning' },
  q => {
    if (!ANARCHY.portal || !ANARCHY.portal.from || !ANARCHY.portal.to)
      return q.failed('§cСервер не настроен')

    q.start(function () {
      this.player.tell('§6Обучение!')
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
          world.afterEvents.playerBreakBlock.subscribe(
            ({ player, brokenBlockPermutation }) => {
              if (player.id !== this.player.id) return
              if (
                !SPAWN.startAxeCanBreak.includes(brokenBlockPermutation.type.id)
              )
                return

              this.diff(1)
            }
          )
        })
      },
    })

    q.dynamic({
      text: 'Залутай аирдроп',
      activate() {
        const airdrop = new Airdrop({
          position: Vector.add(this.player.location, { x: 0, y: 100, z: 0 }),
          loot: LEARNING_L,
          lootTableAir: '80%',
          spawn: true,
        })

        if (!airdrop.chestMinecart) {
          this.next()
          return { cleanup() {} }
        }

        const temporary = new Temporary(({ world }) => {
          world.beforeEvents.playerInteractWithEntity.subscribe(event => {
            if (event.target.id !== airdrop.chestMinecart?.id) return

            if (this.player.id === event.player.id) {
              system.delay(() => this.next())
            } else event.cancel = true
          })
        })

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const qthis = this
        this.quest.steps(this.player).createTargetMarkerInterval({
          from: this.player.location,
          to: this.player.location,
          interval() {
            this.from = qthis.player.location
            this.to = qthis.player.location
          },
          temporary,
        })

        return temporary
      },
    })

    q.end(function () {
      this.player.playSound(SOUNDS.success)
      this.player.tell('§6Обучение закончено!')
    })
  }
)
