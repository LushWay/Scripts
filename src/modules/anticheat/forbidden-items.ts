import { system, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { actionGuard, isNotPlaying } from 'lib'
import { t } from 'lib/text'

const forbiddenItems: string[] = [
  MinecraftItemTypes.Barrier,
  MinecraftItemTypes.StructureBlock,
  MinecraftItemTypes.StructureVoid,
  MinecraftItemTypes.CommandBlock,
  MinecraftItemTypes.CommandBlockMinecart,
  MinecraftItemTypes.ChainCommandBlock,
  MinecraftItemTypes.RepeatingCommandBlock,
]

function interval() {
  try {
    for (const player of world.getAllPlayers()) {
      if (isNotPlaying(player)) continue

      const { container } = player
      if (!container) continue

      for (const [i, slot] of container.slotEntries()) {
        const { typeId } = slot
        if (!typeId) continue

        if (forbiddenItems.includes(typeId)) {
          player.log('ANTICHEAT', t.error`Attention! ${typeId} on slot ${i} detected!`)
          slot.setItem(undefined)
        }
      }
    }
  } catch (e) {
    console.error('Anticheat player error:', e)
  } finally {
    system.runTimeout(interval, 'anticheat', 10)
  }
}

actionGuard((player, region, ctx) => {
  if (isNotPlaying(player)) return

  if (ctx.type === 'interactWithBlock') {
    if (ctx.event.itemStack && forbiddenItems.includes(ctx.event.itemStack.typeId)) {
      player.log('ANTICHEAT', t.error`Attention! ${ctx.event.itemStack.typeId} being placed!`)
      return false
    }
  }
})

system.delay(interval)
