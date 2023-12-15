import { ItemStack, Vector, system, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { SOUNDS } from 'config.js'
import { Quest } from 'lib/Class/Quest.js'
import { Temporary } from 'lib/Class/Temporary.js'
import { DELAYED_BLOCK_PLACE_DB } from 'modules/Gameplay/Survival/breakRestore.js'
import { SURVIVAL_INTERACTION } from 'modules/Gameplay/Survival/index.js'
import { LEARNING_L } from 'modules/Gameplay/Survival/lootTables/learning.js'
import { Airdrop } from 'modules/Server/Class/Airdrop.js'
import { JOIN } from 'modules/Server/PlayerJoin/var.js'
import { util } from 'smapi.js'
import { ANARCHY } from '../anarchy.js'
import { createPublicGiveItemCommand } from '../createPublicGiveItemCommand.js'

JOIN.EVENTS.firstTime.subscribe(player => {
  LEARNING_Q.enter(player)
})

const LEARNING_Q = new Quest({ displayName: 'Обучение', name: 'learning' }, q => {
  if (!ANARCHY.portal || !ANARCHY.portal.from || !ANARCHY.portal.to) return q.failed('§cСервер не настроен')

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
    activate(firstTime) {
      if (firstTime)
        system.delay(() => {
          this.player.getComponent('inventory').container.addItem(LEARNING.START_AXE)
        })

      return new Temporary(({ world }) => {
        world.afterEvents.playerBreakBlock.subscribe(({ player, brokenBlockPermutation }) => {
          if (player.id !== this.player.id) return
          if (!LEARNING.START_AXE_BREAKS.includes(brokenBlockPermutation.type.id)) return

          this.player.playSound(SOUNDS.action)
          this.diff(1)
        })
      })
    },
  })

  let airdroppos = ''
  q.dynamic({
    text: () => '§6Залутай аирдроп' + airdroppos,
    activate() {
      // Saving/restoring value
      const data = this.player.database
      if (!data.quest) return this.error('База данных квестов недоступна')
      const key = data.quest.additional

      console.debug('Airdrop activate w key', key)
      const airdrop = new Airdrop(
        {
          position: Vector.add(this.player.location, {
            x: 0,
            y: 50,
            z: 0,
          }),
          loot: LEARNING_L,
        },
        key
      )

      data.quest.additional = airdrop.key

      if (!key && !airdrop.chestMinecart) return this.error('Не удалось вызвать аирдроп')

      const temporary = new Temporary(({ world }) => {
        world.beforeEvents.playerInteractWithEntity.subscribe(event => {
          const airdropEntity = airdrop.chestMinecart
          if (!airdropEntity) return
          if (event.target.id !== airdropEntity.id) return

          if (this.player.id === event.player.id) {
            system.delay(() => this.next())
          } else event.cancel = true
        })
      })

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const qthis = this
      this.quest.steps(this.player).createTargetMarkerInterval({
        place: Vector.floor(this.player.location),
        interval() {
          const airdropEntity = airdrop.chestMinecart
          if (!airdropEntity) return
          this.place = Vector.floor(airdropEntity.location)
          for (const vector of Vector.foreach(this.place, Vector.add(this.place, { x: 0, y: -10, z: 0 })))
            try {
              world.overworld.spawnParticle(
                'minecraft:balloon_gas_particle',
                Vector.add(vector, { x: 0.5, y: 0.5, z: 0.5 })
              )
            } catch (e) {
              util.error(e)
            }

          airdroppos = ' на\n§f' + Vector.string(Vector.floor(this.place))
          qthis.update()
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
})

export const LEARNING = {
  LEARNING_Q,
  START_AXE: new ItemStack(MinecraftItemTypes.WoodenAxe).setInfo('§r§6Начальный топор', 'Начальный топор'),
  /** @type {string[]} */
  START_AXE_BREAKS: Object.entries(MinecraftBlockTypes)
    .filter(e => e[0].match(/log/i))
    .map(e => e[1]),
}

SURVIVAL_INTERACTION.subscribe((_, __, ctx) => {
  if (
    ctx.type === 'break' &&
    ctx.event.itemStack?.is(LEARNING.START_AXE) &&
    LEARNING.START_AXE_BREAKS.includes(ctx.event.block.typeId)
  )
    return true
})

world.afterEvents.playerBreakBlock.subscribe(event => {
  if (LEARNING.START_AXE_BREAKS.includes(event.brokenBlockPermutation.type.id)) {
    event.block.setType(event.brokenBlockPermutation.type.id.replace(/^stripped_/, '').replace(/_log$/, '_fence'))
    DELAYED_BLOCK_PLACE_DB[Vector.string(event.block.location)] = {
      typeId: event.brokenBlockPermutation.type.id,
      date: Date.now() + util.ms.from('min', 10),
    }
  }
})

createPublicGiveItemCommand('startwand', LEARNING.START_AXE)
