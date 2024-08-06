import { Player, system, world } from '@minecraft/server'

import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'

// Bouncy tnt

world.beforeEvents.itemUse.subscribe(data => {
  if (data.itemStack.typeId !== MinecraftItemTypes.Tnt) return
  data.cancel = true

  system.delay(() => {
    if (!(data.source instanceof Player)) return

    const tntSlot = data.source.mainhand()

    if (tntSlot.amount === 1) tntSlot.setItem(undefined)
    else tntSlot.amount--

    const tnt = data.source.dimension.spawnEntity(MinecraftEntityTypes.Tnt, data.source.location)
    tnt.applyImpulse(data.source.getViewDirection())
    data.source.playSound('camera.take_picture', { volume: 4, pitch: 0.9 })
  })
})
