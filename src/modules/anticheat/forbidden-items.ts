import { system, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { actionGuard, ActionGuardOrder, isNotPlaying } from 'lib'
import { createLogger } from 'lib/utils/logger'

const forbiddenItems: string[] = [
  MinecraftItemTypes.Barrier,
  MinecraftItemTypes.StructureBlock,
  MinecraftItemTypes.StructureVoid,
  MinecraftItemTypes.CommandBlock,
  MinecraftItemTypes.CommandBlockMinecart,
  MinecraftItemTypes.ChainCommandBlock,
  MinecraftItemTypes.RepeatingCommandBlock,
]

const logger = createLogger('AntiCheat')

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
          logger.player(player).error`${typeId} on slot ${i} detected!`
          slot.setItem(undefined)
        }
      }
    }
  } catch (e) {
    logger.error(e)
  } finally {
    system.runTimeout(interval, 'anticheat', 10)
  }
}

actionGuard((player, _, ctx) => {
  if (isNotPlaying(player)) return

  if (ctx.type === 'interactWithBlock') {
    if (ctx.event.itemStack && forbiddenItems.includes(ctx.event.itemStack.typeId)) {
      logger.player(player).error`${ctx.event.itemStack.typeId} being placed!`
      return false
    }
  }
}, ActionGuardOrder.Anticheat)

system.delay(interval)
