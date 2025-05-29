import { world } from '@minecraft/server'
import { Vec } from 'lib'
import { Items } from 'lib/assets/custom-items'

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
  if (itemStack.typeId === Items.WeDash) {
    source.teleport(Vec.add(source.location, Vec.multiply(source.getViewDirection(), 5)))
  }
})
