import { Player, system, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Vector } from 'lib'
import { Cooldown } from 'lib/cooldown'
import { ms } from 'lib/utils/ms'

const cooldown = new Cooldown(ms.from('sec', 3))

export function decreaseItemCount(player: Player) {
  if (player.isGamemode('creative')) return

  const itemSlot = player.mainhand()
  if (itemSlot.amount === 1) itemSlot.setItem(undefined)
  else itemSlot.amount--
}

world.beforeEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId !== MinecraftItemTypes.Tnt) return
  if (!cooldown.isExpired(event.source)) return
  if (event.source.isSneaking) return
  event.cancel = true

  system.delay(() => {
    if (!(event.source instanceof Player)) return

    decreaseItemCount(event.source)

    const tnt = event.source.dimension.spawnEntity(MinecraftEntityTypes.Tnt, event.source.location)
    tnt.applyImpulse(Vector.multiply(event.source.getViewDirection(), 0.8))
    event.source.playSound('camera.take_picture', { volume: 4, pitch: 0.9 })
  })
})

world.beforeEvents.playerPlaceBlock.subscribe(event => {
  if (event.permutationBeingPlaced.type.id !== MinecraftBlockTypes.Tnt) return
  if (!event.player.isSneaking) {
    event.cancel = true
  }
})
