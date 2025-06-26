import { actionGuard, ActionGuardOrder } from 'lib'
import { intlListFormat } from 'lib/i18n/intl'
import { i18n } from 'lib/i18n/text'

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
    i18n.error`Я не знаю что мне делать с этим, стоит спросить ${intlListFormat(i18n.error.style, player.lang, 'or', npcs)}`,
  )
  return false
}, ActionGuardOrder.Permission)
