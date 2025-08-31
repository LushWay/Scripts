import { GameMode, Player, system, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib'
import { Cooldown } from 'lib/cooldown'
import { ms } from 'lib/utils/ms'
import { explosibleEntities, ExplosibleEntityOptions } from './explosible-entities'

const cooldown = new Cooldown(ms.from('sec', 3))

export function decreaseMainhandItemCount(player: Player) {
  if (player.getGameMode() === GameMode.Creative) return

  const slot = player.mainhand()
  if (slot.amount === 1) slot.setItem(undefined)
  else slot.amount--
}

const throwableTntExplosion: ExplosibleEntityOptions = {
  damage: 0,
  strength: 5,
}

world.beforeEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId !== MinecraftItemTypes.Tnt) return
  if (!cooldown.isExpired(event.source)) return
  if (event.source.isSneaking) return

  event.cancel = true
  system.delay(() => {
    if (!(event.source instanceof Player)) return

    decreaseMainhandItemCount(event.source)
    const tnt = event.source.dimension.spawnEntity(MinecraftEntityTypes.Tnt, event.source.location)
    tnt.applyImpulse(Vec.multiply(event.source.getViewDirection(), 0.8))
    event.source.playSound('camera.take_picture', { volume: 4, pitch: 0.9 })
    explosibleEntities.add({ entity: tnt, source: event.source, explosion: throwableTntExplosion })
  })
})

world.beforeEvents.playerPlaceBlock.subscribe(event => {
  if (event.permutationToPlace.type.id !== MinecraftBlockTypes.Tnt) return
  if (!event.player.isSneaking) event.cancel = true
})
