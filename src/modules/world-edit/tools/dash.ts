import { world } from '@minecraft/server'
import { Vector } from 'lib'
import { CustomItems } from 'lib/assets/config'

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
  if (itemStack.typeId === CustomItems.WeDash) {
    source.teleport(Vector.add(source.location, Vector.multiply(source.getViewDirection(), 5)))
  }
})
