import { Enchantment, Vector, world } from '@minecraft/server'

import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { MinecraftEnchantmentTypes } from 'lib/assets/enchantments'
import { DatabaseUtils } from 'lib/database/utils'
import { EventLoader } from 'lib/EventSignal'
import { util } from 'lib/util'

const location = { x: 0, y: -10, z: 0 }

export class Enchantments {
  static custom: { [key: string]: { [key: number]: Enchantment } } = {}

  // @ts-expect-error Eee
  static typed: Record<keyof typeof MinecraftEnchantmentTypes, { [key: number]: Enchantment }> = {}

  static onLoad = new EventLoader()
}

function load() {
  const status = world.overworld.runCommand('structure load CustomEnchantments ' + Vector.string(location))

  if (!status) return util.error(new Error('Unable to load CustomEnchantments structure. Status: §6' + status))

  const entities = world.overworld.getEntities({
    type: DatabaseUtils.entityTypeId,
    location: location,
    maxDistance: 2,
  })

  const entity = entities[0]

  if (!entity) return util.error(new Error('Unable to find CustomEnchantments entity'))

  const { container } = entity
  if (!container) return

  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i)
    if (item?.typeId !== MinecraftItemTypes.EnchantedBook) break

    const enchantments = item.getComponent('enchantments')
    if (!enchantments?.enchantments)
      return util.error(
        new Error('Found unexpected enchantment type on slot ' + i + '. Enchantments: ' + util.inspect(enchantments)),
      )

    for (const enchantment of enchantments.enchantments) {
      Enchantments.custom[enchantment.type.id] ??= [
        new Enchantment(enchantment.type, 1),
        new Enchantment(enchantment.type, 1),
      ]

      Enchantments.custom[enchantment.type.id][enchantment.level] = enchantment
    }
  }

  entities.forEach(e => e.remove())
  // @ts-expect-error AAA
  Enchantments.typed = Enchantments.custom
  EventLoader.load(Enchantments.onLoad)
}

Core.afterEvents.worldLoad.subscribe(load)
