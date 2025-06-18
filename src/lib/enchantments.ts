import { ItemStack, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEnchantmentTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { EventLoader } from 'lib/event-signal'
import { addNamespace } from 'lib/util'
import { enchantmentsJson } from './assets/enchantments'
import { Core } from './extensions/core'

const location = { x: 0, y: -10, z: 0 }
const dimension = world.overworld

export const Enchantments = {
  custom: {} as Record<string, Record<number, Record<string, ItemStack>>>,
  typed: {} as Record<MinecraftEnchantmentTypes, Record<number, Record<MinecraftItemTypes, ItemStack>>>,
  onLoad: new EventLoader(),
}

function load() {
  let expecting = enchantmentsJson.items as number
  for (let i = 1; i <= enchantmentsJson.files; i++) {
    const structure = `mystructure:generated/${i}`
    world.structureManager.place(structure, dimension, location)
    const block = dimension.getBlock(location)
    const chest = block?.getComponent('inventory')

    if (!block || block.typeId !== MinecraftBlockTypes.Chest || !chest?.container)
      return console.warn(
        `Unable to load ${structure}, block is`,
        block?.typeId,
        'chest component:',
        !!chest,
        'container:',
        !!chest?.container,
      )

    for (const [slot, item] of chest.container.entries()) {
      if (expecting === 0) break
      if (!item) {
        console.warn(`No item on slot`, slot, 'in', structure)
        continue
      }

      const enchants = item.enchantable
      const ench = enchants?.getEnchantments()[0]
      if (!enchants || !ench) {
        console.warn(
          'Unable to load enchants for slot',
          slot,
          'in',
          structure,
          'typeId',
          item.typeId,
          'enchs',
          !!enchants,
        )
        continue
      }

      ;((Enchantments.custom[addNamespace(ench.type.id)] ??= {})[ench.level] ??= {})[item.typeId] = item
      expecting--
    }
  }

  if (expecting !== 0) {
    console.warn(`Loading enchants failed: ${enchantmentsJson.items - expecting}\\${enchantmentsJson.items}`)
  }
  Enchantments.typed = Enchantments.custom
  EventLoader.load(Enchantments.onLoad)
}

if (!__VITEST__) Core.afterEvents.worldLoad.subscribe(load)
