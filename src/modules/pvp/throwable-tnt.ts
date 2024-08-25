import { Player, system, world } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Cooldown } from 'lib/cooldown'
import { ms } from 'lib/utils/ms'

const cooldown = new Cooldown(ms.from('sec', 3))

world.beforeEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId !== MinecraftItemTypes.Tnt) return
  if (!cooldown.isExpired(event.source)) return
  event.cancel = true

  system.delay(() => {
    if (!(event.source instanceof Player)) return

    const tntSlot = event.source.mainhand()

    if (tntSlot.amount === 1) tntSlot.setItem(undefined)
    else tntSlot.amount--

    const tnt = event.source.dimension.spawnEntity(MinecraftEntityTypes.Tnt, event.source.location)
    tnt.applyImpulse(event.source.getViewDirection())
    event.source.playSound('camera.take_picture', { volume: 4, pitch: 0.9 })
  })
})
