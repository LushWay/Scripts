import { intlListFormat } from 'lib/i18n/intl'
import { i18n } from 'lib/i18n/text'
import { actionGuard, ActionGuardOrder } from 'lib/region'

const blocked: Record<string, Text[]> = {}

export function lockBlockPriorToNpc(blockType: string, npc: Text) {
  blocked[blockType] ??= []
  blocked[blockType].push(npc)
}

actionGuard((player, region, ctx) => {
  if (ctx.type !== 'interactWithBlock' || !ctx.event.isFirstEvent) return

  const npcs = blocked[ctx.event.block.typeId]
  if (!npcs) return

  player.fail(
    i18n.error`Не умею этим пользоваться, но знаю кто точно поможет: ${intlListFormat(i18n.error.style, player.lang, 'or', npcs)}`,
  )
  return false
}, ActionGuardOrder.Permission)
