import { Enchantment, world } from '@minecraft/server'
import { MinecraftEnchantmentTypes } from '@minecraft/vanilla-data'
import { EventLoader } from 'lib/event-signal'

const location = { x: 0, y: -10, z: 0 }
const dimension = world.overworld

export const Enchantments = {
  custom: {} as Record<string, Record<number, Enchantment>>,

  typed: {} as Record<MinecraftEnchantmentTypes, Record<number, Enchantment>>,

  onLoad: new EventLoader(),
}

function load() {
  // world.structureManager.place('CustomEnchantments', dimension, location)
  // const entities = dimension.getEntities({
  //   type: DatabaseUtils.entityTypeId,
  //   location: location,
  //   maxDistance: 2,
  // })

  // const entity = entities[0]

  // if (!entity) return console.error(new Error('Unable to find CustomEnchantments entity'))

  // const { container } = entity
  // if (!container) return

  // for (let i = 0; i < container.size; i++) {
  //   const item = container.getItem(i)
  //   if (item?.typeId !== MinecraftItemTypes.EnchantedBook) break

  //   const enchantments = item.getComponent('enchantments')
  //   if (!enchantments?.enchantments)
  //     return util.error(
  //       new Error('Found unexpected enchantment type on slot ' + i + '. Enchantments: ' + util.inspect(enchantments)),
  //     )

  //   for (const enchantment of enchantments.enchantments) {
  //     Enchantments.custom[enchantment.type.id] ??= [
  //       new Enchantment(enchantment.type, 1),
  //       new Enchantment(enchantment.type, 1),
  //     ]

  //     Enchantments.custom[enchantment.type.id][enchantment.level] = enchantment
  //   }
  // }

  // entities.forEach(e => e.remove())
  Enchantments.typed = Enchantments.custom
  EventLoader.load(Enchantments.onLoad)
}

Core.afterEvents.worldLoad.subscribe(load)
