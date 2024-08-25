import { actionGuard } from 'lib'
import { t } from 'lib/text'

const blocked: Record<string, string[]> = {}

export function lockBlockPriorToNpc(blockType: string, npc: string) {
  blocked[blockType] ??= []
  blocked[blockType].push(npc)
}

actionGuard((player, region, ctx) => {
  if (ctx.type !== 'interactWithBlock') return
  if (!(ctx.event.block.typeId in blocked)) return

  const npc = blocked[ctx.event.block.typeId]
  if (npc.length > 1) {
    player.fail(
      t.error`Я не знаю что мне делать с этим, возможно ${npc.map((e, i, a) => (i === 0 ? e : i + 1 === a.length ? '§c или §f' + e : '§c, §f' + e)).join('')} смогут сделать это за меня...`,
    )
  } else {
    player.fail(t.error`Я не знаю что мне делать с этим, возможно ${npc[0]} сможет сделать это за меня...`)
  }
  return false
}, -10)
