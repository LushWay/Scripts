import { BlockTypes, Player } from '@minecraft/server'
import { suggest } from 'lib/command/utils'
import { noI18n } from 'lib/i18n/text'
import { onLoad } from 'lib/utils/load-ref'

const prefix = 'minecraft:'
const blocks = onLoad(() => BlockTypes.getAll().map(e => e.id.substring(prefix.length)))
export function blockIsAvaible(block: string, player: Pick<Player, 'tell' | 'lang'>): boolean {
  if (blocks.value.includes(block)) return true

  player.tell(noI18n.error`Блока ${block} не существует.`)
  suggest(player, block, blocks.value)
  return false
}
