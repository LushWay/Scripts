import { world } from '@minecraft/server'
import { Vector } from 'lib'
import { Items } from 'lib/assets/custom-items'

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
  if (itemStack.typeId === Items.WeDash) {
    source.teleport(Vector.add(source.location, Vector.multiply(source.getViewDirection(), 5)))
  }
})
