import { BlockTypes, Player } from '@minecraft/server'
import { suggest } from 'lib/command/utils'
import { noI18n } from 'lib/i18n/text'

const prefix = 'minecraft:'
const blocks = BlockTypes.getAll().map(e => e.id.substring(prefix.length))
export function blockIsAvaible(block: string, player: Pick<Player, 'tell' | 'lang'>): boolean {
  if (blocks.includes(block)) return true

  player.tell(noI18n.error`Блока ${block} не существует.`)
  suggest(player, block, blocks)
  return false
}
