import { Enchantment, Vector, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { DB } from 'lib/Database/Default.js'
import { EventLoader } from 'lib/EventSignal.js'
import { MinecraftEnchantmentTypes } from 'lib/List/enchantments.js'
import { util } from 'lib/util.js'

const LOCATION = { x: 0, y: -10, z: 0 }

export class Enchantments {
  /**
   * @type {{[key: string]: { [key: number]: Enchantment }}}
   */
  static custom = {}

  /**
   * @type {Record<keyof typeof MinecraftEnchantmentTypes, { [key: number]: Enchantment }>}
   */
  // @ts-expect-error Type
  static typed = {}

  static onLoad = new EventLoader()
}

function load() {
  const status = world.overworld.runCommand('structure load CustomEnchantments ' + Vector.string(LOCATION))

  if (!status) return util.error(new Error('Unable to load CustomEnchantments structure. Status: §6' + status))

  const entities = world.overworld.getEntities({
    type: DB.ENTITY_IDENTIFIER,
    location: LOCATION,
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
        new Error('Found unexpected enchantment type on slot ' + i + '. Enchantments: ' + util.inspect(enchantments))
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

  // @ts-expect-error Type
  Enchantments.typed = Enchantments.custom
  EventLoader.load(Enchantments.onLoad)
}

SM.afterEvents.worldLoad.subscribe(load)
